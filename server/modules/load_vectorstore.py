import os
import time
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Load environment variables
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = "us-east-1"
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "ragbot")

os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

UPLOAD_DIR = "./uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
spec = ServerlessSpec(cloud="aws", region=PINECONE_ENV)
existing_indexes = [i["name"] for i in pc.list_indexes()]

if PINECONE_INDEX_NAME not in existing_indexes:
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=3072,  # For gemini-embedding-001
        metric="dotproduct",
        spec=spec
    )
    while not pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
        time.sleep(1)

index = pc.Index(PINECONE_INDEX_NAME)

# Load, split, embed and upsert PDF content
def load_vectorstore(uploaded_files):
    embed_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    file_paths = []

    for file in uploaded_files:
        save_path = Path(UPLOAD_DIR) / file.filename
        with open(save_path, "wb") as f:
            file.file.seek(0)  # Ensure we read from the start
            content = file.file.read()
            f.write(content)
            print(f"📁 Saved {file.filename}: {len(content)} bytes")
        file_paths.append(str(save_path))

    for file_path in file_paths:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        print(f"📄 Loaded {len(documents)} pages from {file_path}")

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(documents)
        print(f"✂️ Split into {len(chunks)} chunks")

        texts = [chunk.page_content for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]
        ids = [f"{Path(file_path).stem}-{i}" for i in range(len(chunks))]

        print(f"🔍 Embedding {len(texts)} chunks...")
        embeddings = embed_model.embed_documents(texts)

        # Build vectors with text included in metadata for retrieval
        vectors = []
        for vid, emb, text, meta in zip(ids, embeddings, texts, metadatas):
            clean_meta = {k: str(v).encode('ascii', errors='replace').decode('ascii') for k, v in meta.items()}
            clean_meta["text"] = text.encode('ascii', errors='replace').decode('ascii')
            vectors.append({"id": vid, "values": emb, "metadata": clean_meta})

        print("📤 Uploading to Pinecone...")
        # Upsert in batches of 100 to avoid payload size limits
        batch_size = 100
        with tqdm(total=len(vectors), desc="Upserting to Pinecone") as progress:
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                index.upsert(vectors=batch)
                progress.update(len(batch))

        print(f"✅ Upload complete for {file_path}")
