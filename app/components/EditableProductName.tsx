import { useState } from "react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { StoreProductReport } from "@/types/products";

// ... inside your StoreReportClient file ...

const EditableProductName = ({ product, designId, storeCode }: { product: StoreProductReport, designId: string, storeCode: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(product.newProductName || product.productName);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Product name cannot be empty");
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await fetch("/api/products/update_name", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    store_code: storeCode,
                    sage_code: product.sage_code,
                    design_code: designId,
                    product_name: name
                })
            });

            if (!response.ok) throw new Error("Failed to update");
            
            toast.success("Product name updated");
            setIsEditing(false);
            // Ideally, trigger a data refresh here
        } catch (error) {
            console.error(error);
            toast.error("Error updating name");
        } finally {
            setIsLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input 
                    className="border rounded px-2 py-1 text-sm w-full max-w-xs"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                />
                <button onClick={handleSave} className="text-green-600" disabled={isLoading}><FaCheck /></button>
                <button onClick={() => { setIsEditing(false); setName(product.newProductName || product.productName); }} className="text-red-600" disabled={isLoading}><FaTimes /></button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group">
            <span className="font-medium">{name}</span>
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaEdit />
            </button>
        </div>
    );
};

// Usage in your main component:
// <EditableProductName product={product} storeCode={store_code} />
export default EditableProductName;