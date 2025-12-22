import { createClient } from "@/utils/supabase/ssr_client/client";

export const getColorCode = async (colorName: string): Promise<string | null> => {
    try {
        if (!colorName || !colorName.trim()) return null;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("Color Codes")
            .select("color_code")
            .ilike("name", colorName)
            .limit(1);

        if (error) {
            console.error("[getColorCode] Supabase error:", error.message ?? error);
            return null;
        }
        if (!data || data.length === 0) return null;

        return data[0]?.color_code ?? null;
    } catch (e) {
        console.error("[getColorCode] unexpected error:", e);
        return null;
    }
};
