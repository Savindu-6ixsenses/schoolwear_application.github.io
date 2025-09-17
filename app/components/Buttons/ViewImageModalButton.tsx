import React from 'react'
import { FaEye } from 'react-icons/fa'

interface ViewImageModalButtonProps {
    disabled?: boolean;
    className?: string
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ViewImageModalButton = ({disabled, className,setIsModalOpen}: ViewImageModalButtonProps) => {
  return (
    <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                disabled={disabled? disabled : false}
                                className={className? className :"p-2.5 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"}
                                aria-label="View design guideline details"
                            >
                                <FaEye className="text-gray-600" />
                            </button>
  )
}

export default ViewImageModalButton