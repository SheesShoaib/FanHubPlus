import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="confirm-dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="confirm-dialog"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="confirm-dialog-close"
              onClick={onCancel}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className={danger ? "confirm-dialog-icon danger" : "confirm-dialog-icon"}>
              <AlertTriangle size={22} />
            </div>

            <h3>{title}</h3>
            {message && <p>{message}</p>}

            <div className="confirm-dialog-actions">
              <button type="button" className="confirm-dialog-cancel" onClick={onCancel}>
                {cancelLabel}
              </button>

              <button
                type="button"
                className={danger ? "confirm-dialog-confirm danger" : "confirm-dialog-confirm"}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
