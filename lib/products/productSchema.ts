import { z } from 'zod';

export const productSchema = z.object({
  item_type: z.string().optional().or(z.literal('').transform(() => undefined)),
  product_id: z.string().min(1, 'Product ID is required'),
  product_name: z.string().min(1, 'Product Name is required'),
  product_type: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  sage_code: z.string().optional(),
  brand_name: z.string().optional(),
  product_description: z.string().optional(),
  product_weight: z.coerce.number().optional(),
  is_created: z.coerce.boolean().optional().default(false),

  xs: z.coerce.boolean().optional(),
  sm: z.coerce.boolean().optional(),
  md: z.coerce.boolean().optional(),
  lg: z.coerce.boolean().optional(),
  xl: z.coerce.boolean().optional(),
  x2: z.coerce.boolean().optional(),
  x3: z.coerce.boolean().optional(),

  category: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

export type RowResult = {
	row: number;
	status: "inserted" | "skipped" | "failed";
	message?: string;
	sku?: string;
};

export type BulkImportResult = {
	ok: boolean;
	totalRows: number;
	validated: number;
	inserted: number;
	skipped: number;
	failed: number;
	results: RowResult[];
	errorCsvUrl?: string; // Optional: for signed URLs to error files
};
