from langchain_core.prompts import PromptTemplate
from langchain_classic.chains import RetrievalQA
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_llm_chain(retriever):
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile"
    )

    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template="""
You are **RagBot**, an intelligent AI assistant. You have access to relevant excerpts from the user's uploaded documents.

Use the provided context as your primary knowledge base, but feel free to enhance your answers with your own understanding to give the most helpful, comprehensive, and well-structured response possible.

---

📄 **Document Context**:
{context}

❓ **User Question**:
{question}

---

💬 **Instructions**:
- Use the document context as a foundation and enrich your answer with clear explanations, examples, or insights.
- Structure your response well — use bullet points, numbered lists, or headings when appropriate.
- If the context is relevant but incomplete, supplement with your own knowledge and mention when you're doing so.
- If the context is entirely unrelated, let the user know and still try to help based on your own knowledge.
- Be concise yet thorough. Prioritize clarity and usefulness.
"""
    )

    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": prompt},
        return_source_documents=True
    )
