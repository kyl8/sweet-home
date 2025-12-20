import logging

logging.basicConfig(
    level=logging.DEBUG, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def _format_with_context(message: str, context) -> str:
    if context is None:
        return message
    try:
        return f"{message} | context={context}"
    except Exception:
        return message

def log_debug(message: str, *args, **kwargs):
    context = args[0] if args else None
    logging.debug(_format_with_context(message, context))

def log_info(message: str, *args, **kwargs):
    context = args[0] if args else None
    logging.info(_format_with_context(message, context))

def log_warn(message: str, *args, **kwargs):
    context = args[0] if args else None
    logging.warning(_format_with_context(message, context))

def log_error(message: str, *args, exc_info: bool = False, **kwargs):
    context = args[0] if args else None
    logging.error(_format_with_context(message, context), exc_info=exc_info)
