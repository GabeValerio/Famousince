'use client'; // Ensure this component is a client component

import React, { useEffect, useState, Suspense } from 'react';
import { useCart } from "@/lib/CartContext";
import { useRouter, useSearchParams } from 'next/navigation'; // Use 'next/navigation' for app directory
import { supabase } from '@/lib/supabaseClient'; // Add this import
import { ProductCard } from "../Home/components/ProductCard";
import type { Product, ProductVariant } from "../Home/data/products";

const ProductList = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const fetchProducts = async () => {
		try {
			const { data: productsData, error: productsError } = await supabase
				.from('products')
				.select(`
					*,
					variants:product_variants(
						id,
						size,
						color,
						price
					)
				`);

			if (productsError) throw productsError;

			if (productsData) {
				const formattedProducts = productsData.map(p => ({
					id: p.id,
					name: p.name || 'FAMOUS SINCE',
					description: p.description || '',
					image: p.front_image_url,
					price: p.base_price,
					famousLine: p.description || 'BEING UNIQUE',
					variants: (p.variants || []).map((v: { id: string; size: string; color?: string; price?: number }) => ({
						id: v.id,
						size: v.size,
						color: v.color || 'Black', // Default to Black if no color specified
						price: v.price || p.base_price
					}))
				}));

				const validProducts = formattedProducts.filter(p => p.image);
				const shuffledProducts = validProducts.sort(() => Math.random() - 0.5);
				setProducts(shuffledProducts);
			}
		} catch (err) {
			console.error("Error fetching products:", err);
			setError(err instanceof Error ? err : new Error("An unknown error occurred"));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen bg-black text-white flex items-center justify-center">
				<div className="text-2xl" style={{ fontFamily: 'Chalkduster, fantasy' }}>
					Loading products...
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-black text-white flex items-center justify-center">
				<div className="text-2xl text-red-500" style={{ fontFamily: 'Chalkduster, fantasy' }}>
					Error loading products: {error.message}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-black text-white">
			<div className="py-16">
				{/* Title Section */}
				<div className="text-center mb-16">
					<h1 
						className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight" 
						style={{ fontFamily: 'Chalkduster, fantasy' }}
					>
						SHOP NOW
					</h1>
				</div>

				{/* Products Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto px-4">
					{products.map((product) => (
						<ProductCard
							key={product.id}
							product={product}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

const ShopPage = () => {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-black text-white flex items-center justify-center">
				<div className="text-2xl" style={{ fontFamily: 'Chalkduster, fantasy' }}>
					Loading...
				</div>
			</div>
		}>
			<ProductList />
		</Suspense>
	);
};

export default ShopPage;
