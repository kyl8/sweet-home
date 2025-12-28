import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    sh = logging.StreamHandler()
    sh.setFormatter(fmt)
    fh = RotatingFileHandler("server.log", maxBytes=10_000_000, backupCount=5)
    fh.setFormatter(fmt)
    logger.addHandler(sh)
    logger.addHandler(fh)
