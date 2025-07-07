import { createClient } from "@/utils/supabase/ssr_client/client";
import { FormData } from "@/types/store";

function generateBaseStoreCode(schoolName: string) {
  return schoolName
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map(word => word[0].toUpperCase())
    .join("");
}


async function fetchExistingStoreCodes(baseCode: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("stores") // adjust to your actual table name
    .select("store_code")
    .ilike("store_code", `${baseCode}%`); // case-insensitive starts with

  if (error) {
    console.error("Error fetching store codes:", error);
    return [];
  }

  return data.map(d => d.store_code);
}



function getUniqueStoreCode(baseCode: string, existingCodes: string[]): string {
  if (!existingCodes.includes(baseCode)) return baseCode;

  let suffix = 1;
  let newCode = `${baseCode}${suffix}`;

  while (existingCodes.includes(newCode)) {
    suffix++;
    newCode = `${baseCode}${suffix}`;
  }

  return newCode;
}


export async function updateStoreCodeAutomatically(schoolName: string, setFormData: React.Dispatch<React.SetStateAction<FormData>>) {
  const baseCode = generateBaseStoreCode(schoolName);
  const existingCodes = await fetchExistingStoreCodes(baseCode);
  const uniqueCode = getUniqueStoreCode(baseCode, existingCodes);

  setFormData(prev => ({
    ...prev,
    storeCode: uniqueCode,
  }));
}


