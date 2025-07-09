"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Box } from 'lucide-react';
import Image from 'next/image';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  customer_email: string;
  shipping_address: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  items: {
    id: string;
    quantity: number;
    product: {
      name: string;
      description: string;
      front_image_url?: string;
    };
    variant: {
      size: string;
      color: string;
      price: number;
    };
  }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            id,
            quantity,
            product:products (
              name,
              description,
              front_image_url
            ),
            variant:product_variants (
              size,
              color,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="mt-2 text-white/60">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 
          className="text-white text-2xl md:text-3xl"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Orders
        </h1>
      </div>

      <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 p-6 relative">
        {error && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-white/80">No orders to display yet.</p>
            <p className="mt-2 text-white/60">Orders will appear here when customers make purchases.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white/60">Order Date</TableHead>
                    <TableHead className="text-white/60">Customer</TableHead>
                    <TableHead className="text-white/60">Status</TableHead>
                    <TableHead className="text-white/60">Total</TableHead>
                    <TableHead className="text-white/60">Items</TableHead>
                    <TableHead className="text-white/60 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <TableRow className="border-white/20">
                        <TableCell className="font-medium text-white">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell className="text-white">
                          {order.shipping_address.name}
                          <div className="text-sm text-white/60">
                            {order.customer_email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-white">
                          ${order.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="flex gap-2">
                            {order.items.map((item, index) => (
                              <div 
                                key={item.id}
                                className="relative w-12 h-12 border border-white/20 rounded overflow-hidden"
                                title={`${item.product.name} - ${item.variant.size}`}
                              >
                                {item.product.front_image_url ? (
                                  <Image
                                    src={item.product.front_image_url}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                    <Box className="h-6 w-6 text-white/40" />
                                  </div>
                                )}
                                {item.quantity > 1 && (
                                  <div className="absolute bottom-0 right-0 bg-black/80 px-1 rounded-tl text-xs text-white">
                                    ×{item.quantity}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedOrder === order.id && (
                        <TableRow className="border-white/20 bg-white/5">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-sm font-medium text-white/80 mb-2">Shipping Address</h3>
                                <div className="text-sm text-white/60">
                                  {order.shipping_address.address.line1}
                                  {order.shipping_address.address.line2 && (
                                    <>, {order.shipping_address.address.line2}</>
                                  )}
                                  <br />
                                  {order.shipping_address.address.city}, {order.shipping_address.address.state} {order.shipping_address.address.postal_code}
                                  <br />
                                  {order.shipping_address.address.country}
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-white/80 mb-2">Order Items</h3>
                                <div className="space-y-2">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-white/60">
                                      <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 border border-white/20 rounded overflow-hidden">
                                          {item.product.front_image_url ? (
                                            <Image
                                              src={item.product.front_image_url}
                                              alt={item.product.name}
                                              fill
                                              className="object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                              <Box className="h-8 w-8 text-white/40" />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-medium text-white">{item.product.name}</div>
                                          <div className="text-sm">
                                            Size: {item.variant.size}, Color: {item.variant.color}
                                          </div>
                                          <div className="text-sm">
                                            Quantity: {item.quantity} × ${item.variant.price.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-white font-medium">
                                        ${(item.quantity * item.variant.price).toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 