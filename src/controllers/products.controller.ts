import { Request, Response } from "express";
import Product, { IProduct } from "../models/products.model";


export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            product_name,
            product_description,
            product_price,
            product_instock,
            product_sold,
            total_products,
            product_discount,
        } = req.body;

        if (!product_name || !product_description || !product_price || !total_products) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        if (Number(product_price) < 0) {
            res.status(400).json({ success: false, message: "Product price cannot be negative" });
            return;
        }
        if (Number(total_products) < 0) {
            res.status(400).json({ success: false, message: "Total products cannot be negative" });
            return;
        }
        const newProduct: IProduct = new Product({
            product_name,
            product_description,
            product_price: Number(product_price),
            product_instock: product_instock === "true",
            product_sold: Number(product_sold) || 0,
            total_products: Number(total_products),
            product_photos: (req.files as Express.Multer.File[])?.map(file => file.path) || [],
            product_discount: Number(product_discount) || 0,
        });
        await newProduct.save();
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct
        });
        return;
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: "Failed to create product", error });
    }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await Product.find();
        if (products.length === 0) {
            res.status(400).json({
                success: false,
                message: "No products found"
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            products: products
        });
        return;
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving products",
            error: (error as Error).message
        });
    }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = req.params.id;
        const {
            product_name,
            product_description,
            product_price,
            product_instock,
            product_sold,
            total_products,
            product_discount,
        } = req.body;

        const productToUpdate = await Product.findById(productId);

        if (!productToUpdate) {
            res.status(400).json({
                success: false,
                message: "Product id required"
            });
            return;
        };
        productToUpdate.product_name = product_name || productToUpdate.product_name;
        productToUpdate.product_description = product_description || productToUpdate.product_description;
        productToUpdate.product_price = product_price || productToUpdate.product_price;
        productToUpdate.product_instock = product_instock !== undefined ? product_instock === "true" : productToUpdate.product_instock;
        productToUpdate.product_sold = product_sold ? Number(product_sold) : productToUpdate.product_sold;
        productToUpdate.total_products = total_products ? Number(total_products) : productToUpdate.total_products;
        productToUpdate.product_discount = product_discount ? Number(product_discount) : productToUpdate.product_discount;

        if (req.files) {
            productToUpdate.product_photos = (req.files as Express.Multer.File[])?.map(file => file.path) || productToUpdate.product_photos;
        };

        const updatedProduct = await productToUpdate.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            updateProduct: updatedProduct
        });
        return;
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: (error as Error).message
        })
    }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = req.params.id;
        if (!productId) {
            res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }
        const product = await Product.findByIdAndDelete(productId);

        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found"
            });
            return;
        }
        res.status(200).json({
            success: false,
            message: "Product deleted successfully",
        });
        return;
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error occured while deleting product",
            error: (error as Error).message
        })
    }
}

