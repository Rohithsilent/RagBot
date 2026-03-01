from logger import logger



def query_chain(chain, user_input: str, chat_history: str = ""):
    try:
        logger.debug(f"Running chain for input: {user_input}")

        # Prepend conversation history to the question so the LLM sees it
        if chat_history.strip():
            augmented_query = f"[Conversation History]\n{chat_history}\n\n[Current Question]\n{user_input}"
        else:
            augmented_query = user_input

        result = chain.invoke({"query": augmented_query})
        response = {
            "response": result["result"],
            "sources": [doc.metadata.get("source", "") for doc in result["source_documents"]]
        }
        logger.debug(f"Chain response: {response}")
        return response
    except Exception as e:
        logger.exception("Error in query_chain")
        raise