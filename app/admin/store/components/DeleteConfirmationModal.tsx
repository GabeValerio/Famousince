import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Only close if deletion was successful
      onClose();
    } catch (error) {
      console.error('Error during deletion:', error);
      // Don't close on error - let the user try again or cancel
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        // Close modal when clicking backdrop, but not when deleting
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="bg-black rounded-lg border border-white/20 shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 
          className="text-lg font-semibold mb-4 text-white"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Confirm Delete
        </h3>
        <p className="text-white/80 mb-4">
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/20 rounded-md shadow-sm text-sm font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 border border-red-500/20 rounded-md shadow-sm text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="opacity-0">Delete</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 