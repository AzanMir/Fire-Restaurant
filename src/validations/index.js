import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

// Category
export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
});

// Menu Item
export const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  category_id: z.string().uuid("Select a valid category").nullable().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  is_available: z.boolean().default(true),
});

// Recipe Item
export const recipeItemSchema = z.object({
  ingredient_id: z.string().uuid("Select a valid ingredient"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
});

// Order
export const orderSchema = z.object({
  customer_name: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  payment_method: z.enum(["Cash", "Card", "Online"]),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

// Inventory / Ingredient
export const ingredientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  unit: z.string().min(1, "Unit is required"),
  current_stock: z.coerce.number().min(0, "Stock cannot be negative"),
  minimum_stock: z.coerce.number().min(0, "Minimum stock cannot be negative"),
  purchase_price: z.coerce.number().min(0, "Price cannot be negative"),
  supplier_id: z.string().uuid().nullable().optional(),
});

// Supplier
export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

// Staff
export const staffSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Invalid email"),
  phone: z.string().max(20).optional(),
  role: z.enum(["admin", "staff"]),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

// Settings
export const settingsSchema = z.object({
  restaurant_name: z.string().min(1, "Restaurant name is required"),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  currency: z.string().min(1).max(10).default("Rs."),
  tax_percentage: z.coerce.number().min(0).max(100).default(5),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
});
