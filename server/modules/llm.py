from langchain_core.prompts import PromptTemplate
from langchain_classic.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI, HarmBlockThreshold, HarmCategory
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def get_llm_chain(retriever):
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.2,
        safety_settings={
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        }
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
- If the user's question references previous conversation, use the conversation history included in the question to provide context-aware answers.
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
