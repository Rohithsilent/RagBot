import os
from fastapi import FastAPI, UploadFile, File, Form, Request, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from modules.load_vectorstore import load_vectorstore
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from logger import logger

app = FastAPI(title="RagBot2.0")

# allow frontend dynamically
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def catch_exception_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception(f"UNHANDLED EXCEPTION for {request.method} {request.url}")
        return JSONResponse(status_code=500, content={"error": "An internal server error occurred. Please try again later."})

# ─── Helper: extract & validate X-User-Id ────────────────────
def _get_user_id(x_user_id: Optional[str]) -> str:
    if not x_user_id or not x_user_id.strip():
        raise ValueError("Missing X-User-Id header")
    return x_user_id.strip()


# ═══════════════════════════════════════════════════════════════
# Upload Docs — upserts into the user's Pinecone namespace
# ═══════════════════════════════════════════════════════════════
@app.post("/upload_docs/")
async def upload_docs(
    files: List[UploadFile] = File(...),
    x_user_id: Optional[str] = Header(None),
):
    try:
        user_id = _get_user_id(x_user_id)
        logger.info(f"Received {len(files)} files from user {user_id}")
        load_vectorstore(files, namespace=user_id)
        logger.info(f"Documents added to Pinecone namespace '{user_id}'")
        return {"message": "Files processed and vectorstore updated"}
    except ValueError as ve:
        return JSONResponse(status_code=400, content={"error": str(ve)})
    except Exception as e:
        logger.exception("Error during document upload")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ═══════════════════════════════════════════════════════════════
# Ask — queries only within the user's namespace
# ═══════════════════════════════════════════════════════════════
@app.post("/ask/")
async def ask_question(
    question: str = Form(...),
    chat_history: str = Form(""),
    x_user_id: Optional[str] = Header(None),
):
    try:
        user_id = _get_user_id(x_user_id)
        logger.info(f"User query from {user_id}: {question}")

        from pinecone import Pinecone
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        from langchain_core.documents import Document
        from langchain_core.retrievers import BaseRetriever
        from typing import List, Optional
        from pydantic import Field
        from modules.llm import get_llm_chain
        from modules.query_handlers import query_chain

        # 1. Pinecone + Embedding setup
        pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
        index = pc.Index(os.environ["PINECONE_INDEX_NAME"])
        embed_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

        # 2. Embed the question
        embedded_query = embed_model.embed_query(question)

        # 3. Query Pinecone — scoped to user's namespace
        res = index.query(
            vector=embedded_query,
            top_k=3,
            include_metadata=True,
            namespace=user_id,
        )

        # 4. Convert to LangChain Documents
        docs = [
            Document(
                page_content=match["metadata"].get("text", ""),
                metadata=match["metadata"]
            ) for match in res["matches"]
        ]

        # 5. Pydantic-compliant retriever subclass
        class SimpleRetriever(BaseRetriever):
            tags: Optional[List[str]] = Field(default_factory=list)
            metadata: Optional[dict] = Field(default_factory=dict)

            def __init__(self, documents: List[Document]):
                super().__init__()
                self._docs = documents

            def _get_relevant_documents(self, query: str) -> List[Document]:
                return self._docs

        retriever = SimpleRetriever(docs)

        # 6. LLM + RetrievalQA chain
        chain = get_llm_chain(retriever)
        result = query_chain(chain, question, chat_history)

        logger.info("query successful")
        return result

    except ValueError as ve:
        return JSONResponse(status_code=400, content={"error": str(ve)})
    except Exception as e:
        logger.exception("Error processing question")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ═══════════════════════════════════════════════════════════════
# List Documents — returns filenames in the user's namespace
# ═══════════════════════════════════════════════════════════════
@app.get("/documents")
async def list_documents(x_user_id: Optional[str] = Header(None)):
    try:
        user_id = _get_user_id(x_user_id)
        logger.info(f"Listing documents for user {user_id}")

        from pinecone import Pinecone

        pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
        index = pc.Index(os.environ["PINECONE_INDEX_NAME"])

        # Use list() to get all vector IDs in the namespace, then fetch metadata
        # Pinecone's list endpoint returns IDs; we fetch in batches to get metadata
        all_filenames = set()
        
        # Use a non-zero dummy vector with a large top_k to discover filenames
        # The embedding dimension is 3072 for gemini-embedding-001
        dummy_vector = [0.1] * 3072
        results = index.query(
            vector=dummy_vector,
            top_k=10000,
            include_metadata=True,
            namespace=user_id,
        )

        for match in results.get("matches", []):
            filename = match.get("metadata", {}).get("filename", "")
            if filename:
                all_filenames.add(filename)

        return {"documents": sorted(list(all_filenames))}

    except ValueError as ve:
        return JSONResponse(status_code=400, content={"error": str(ve)})
    except Exception as e:
        logger.exception("Error listing documents")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ═══════════════════════════════════════════════════════════════
# Delete Document — removes all vectors for a filename from namespace
# ═══════════════════════════════════════════════════════════════
@app.delete("/documents/{filename}")
async def delete_document(filename: str, x_user_id: Optional[str] = Header(None)):
    try:
        user_id = _get_user_id(x_user_id)
        logger.info(f"Deleting '{filename}' for user {user_id}")

        from pinecone import Pinecone

        pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
        index = pc.Index(os.environ["PINECONE_INDEX_NAME"])

        # Find all vector IDs that belong to this filename in the user's namespace
        dummy_vector = [0.1] * 3072
        results = index.query(
            vector=dummy_vector,
            top_k=10000,
            include_metadata=True,
            namespace=user_id,
            filter={"filename": {"$eq": filename}},
        )

        ids_to_delete = [match["id"] for match in results.get("matches", [])]

        if ids_to_delete:
            # Delete in batches of 1000 (Pinecone limit)
            for i in range(0, len(ids_to_delete), 1000):
                batch = ids_to_delete[i:i + 1000]
                index.delete(ids=batch, namespace=user_id)
            logger.info(f"Deleted {len(ids_to_delete)} vectors for '{filename}'")
        else:
            logger.info(f"No vectors found for '{filename}' in namespace '{user_id}'")

        return {"message": f"Deleted '{filename}' successfully", "deleted_count": len(ids_to_delete)}

    except ValueError as ve:
        return JSONResponse(status_code=400, content={"error": str(ve)})
    except Exception as e:
        logger.exception("Error deleting document")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/test")
async def test():
    return {"message":"Testing successfull..."}