import os
import time
import re
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm
from pinecone import Pinecone, ServerlessSpec
import nltk

# Auto-download required NLTK data for unstructured pptx parsing
for package in ['averaged_perceptron_tagger', 'punkt', 'punkt_tab']:
    try:
        path = f'tokenizers/{package}' if 'punkt' in package else f'taggers/{package}'
        nltk.data.find(path)
    except Exception:
        nltk.download(package, download_dir=nltk.data.path[0] if nltk.data.path else None)
from langchain_community.document_loaders import (
    PyPDFLoader, 
    Docx2txtLoader, 
    TextLoader, 
    CSVLoader, 
    UnstructuredPowerPointLoader
)
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
def load_vectorstore(uploaded_files, namespace: str = ""):
    embed_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    file_paths = []
    filenames = []

    for file in uploaded_files:
        save_path = Path(UPLOAD_DIR) / file.filename
        with open(save_path, "wb") as f:
            file.file.seek(0)  # Ensure we read from the start
            content = file.file.read()
            f.write(content)
            print(f"📁 Saved {file.filename}: {len(content)} bytes")
        file_paths.append(str(save_path))
        filenames.append(file.filename)

    for file_path, original_filename in zip(file_paths, filenames):
        ext = Path(file_path).suffix.lower()
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
        elif ext == ".docx":
            loader = Docx2txtLoader(file_path)
        elif ext == ".txt":
            loader = TextLoader(file_path, encoding="utf-8")
        elif ext == ".csv":
            loader = CSVLoader(file_path)
        elif ext in [".ppt", ".pptx"]:
            loader = UnstructuredPowerPointLoader(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
            
        documents = loader.load()
        print(f"📄 Loaded {len(documents)} pages from {file_path}")

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(documents)
        print(f"✂️ Split into {len(chunks)} chunks")

        if len(chunks) == 0:
            raise ValueError(f"No text could be extracted from {original_filename}. If it is a scanned image, OCR is required.")

        texts = [chunk.page_content for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]
        ids = [f"{Path(file_path).stem}-{i}" for i in range(len(chunks))]

        print(f"🔍 Embedding {len(texts)} chunks...")
        embeddings = []
        
        # Gemini free tier limits embed requests to 100/min.
        # We process in batches and handle rate limits gracefully.
        batch_size_embed = 30
        for i in range(0, len(texts), batch_size_embed):
            batch_texts = texts[i:i + batch_size_embed]
            try:
                batch_embeddings = embed_model.embed_documents(batch_texts)
                embeddings.extend(batch_embeddings)
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    retry_match = re.search(r"Please retry in (\d+\.?\d*)s", error_str)
                    wait_time = float(retry_match.group(1)) + 2.0 if retry_match else 60.0
                    print(f"⚠️ Rate limit hit at chunk {i}. Waiting {wait_time:.1f} seconds to retry...")
                    time.sleep(wait_time)
                    batch_embeddings = embed_model.embed_documents(batch_texts)
                    embeddings.extend(batch_embeddings)
                else:
                    raise e
            
            # If there are more batches, sleep a bit to avoid hitting the quota
            if i + batch_size_embed < len(texts):
                time.sleep(20)

        # Build vectors with text included in metadata for retrieval
        vectors = []
        for vid, emb, text, meta in zip(ids, embeddings, texts, metadatas):
            clean_meta = {k: str(v).encode('ascii', errors='replace').decode('ascii') for k, v in meta.items()}
            clean_meta["text"] = text.encode('ascii', errors='replace').decode('ascii')
            clean_meta["filename"] = original_filename  # Store filename for list/delete
            vectors.append({"id": vid, "values": emb, "metadata": clean_meta})

        print(f"📤 Uploading to Pinecone (namespace={namespace})...")
        # Upsert in batches of 100 to avoid payload size limits
        batch_size = 100
        with tqdm(total=len(vectors), desc="Upserting to Pinecone") as progress:
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                index.upsert(vectors=batch, namespace=namespace)
                progress.update(len(batch))

        print(f"✅ Upload complete for {file_path} in namespace '{namespace}'")
