import logging
import sys

def setup_logger(name="ragbot"):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.DEBUG)

    # File handler for production logging
    fh = logging.FileHandler("app.log")
    fh.setLevel(logging.INFO)

    # formatter
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] -  %(message)s ")
    ch.setFormatter(formatter)
    fh.setFormatter(formatter)

    if not logger.hasHandlers():
        logger.addHandler(ch)
        logger.addHandler(fh)

    return logger

logger = setup_logger()