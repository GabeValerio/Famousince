"use client";

import StripePayment from "@/app/shop/checkout/components/StripePayment"; 
import convertToSubcurrency from "@/lib/convertToSubcurrency";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "@/lib/CartContext";
import { useState } from "react";
import countryMapping from "@/lib/countryMapping";
import { useRouter } from "next/navigation";
import Image from 'next/image';

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
  priceID?: string;
  isSubscription?: boolean;
  freeShipping?: boolean;
  noTax?: boolean;
}

interface CustomerData {
  customerId: string;
  error?: string;
}

if (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY === undefined) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not defined");
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export default function CheckoutFlow() {
  const router = useRouter();
  const { totalAmount, cart } = useCart() as { totalAmount: number; cart: CartItem[] };
  const [currentStep, setCurrentStep] = useState(1);
  const [contactInfo, setContactInfo] = useState({ email: "" });
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    country: "",
    zip: ""
  });
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [invalidCoupon, setInvalidCoupon] = useState(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [selectedShippingOption, setSelectedShippingOption] = useState("standard");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [billingCountry, setBillingCountry] = useState<string>("");
  const [billingPostalCode, setBillingPostalCode] = useState<string>("");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  const hasShippingException = cart.some(item => item.freeShipping);
  const hasTaxException = cart.some(item => item.noTax);

  const subtotal = cart.reduce((acc: number, item) => acc + (item.price * item.quantity), 0);
  const taxRate = 0.09;
  const shippingCost = hasShippingException ? 0 : selectedShippingOption === "standard" ? 10.0 : 20.0;
  const taxes = hasTaxException ? 0 : subtotal * taxRate;
  const total = subtotal + taxes + shippingCost - discountAmount;

  const handleReturnInfo = () => {
    router.back();
  };

  const handleReturnShippingPayment = () => {
    setCurrentStep(1);
  };

  const handleReturnPayment = () => {
    setCurrentStep(2);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!contactInfo.email || !shippingInfo.fullName || !shippingInfo.streetAddress || !shippingInfo.city || !shippingInfo.state || !shippingInfo.country || !shippingInfo.zip) {
        setErrorMessage("Please fill in all required fields.");
        return;
      } else {
        setErrorMessage("");
      }
    }

    if (currentStep === 2) {
      const customerResponse = await fetch("/api/create-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: contactInfo.email,
          name: shippingInfo.fullName,
        }),
      });

      const customerData = await customerResponse.json();
      if (customerData.error) {
        setErrorMessage(customerData.error);
        return;
      }

      setCurrentStep((prevStep) => prevStep + 1);
      setCustomerData(customerData);
    } else {
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));

    if (name === "country") {
      setBillingCountry(value);
    }
  };

  const handleApplyDiscount = () => {
    if (discountCode === "SAVE10") {
      setDiscountAmount(subtotal * 0.1);
      setInvalidCoupon(false);
    } else if (discountCode === "FREESHIP") {
      setDiscountAmount(shippingCost);
      setInvalidCoupon(false);
    } else {
      setInvalidCoupon(true);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Chalkduster, fantasy' }}>
                <span className={currentStep === 1 ? "font-bold" : "font-normal"}>Information</span> &gt; 
                <span className={currentStep === 2 ? "font-bold" : "font-normal"}> Shipping</span> &gt; 
                <span className={currentStep === 3 ? "font-bold" : "font-normal"}> Payment</span>
              </h2>
            </div>
            <hr className="border-t border-white/20" />

            {currentStep === 1 && (
              <div className="mb-5">
                <h2 className="text-2xl font-bold mt-4 text-center" style={{ fontFamily: 'Chalkduster, fantasy' }}>Contact Information</h2>
                <div className="mt-4 relative">
                  <input 
                    type="email" 
                    name="email" 
                    value={contactInfo.email} 
                    onChange={handleContactChange} 
                    placeholder="Email Address"
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                    required
                  />
                </div>

                <h2 className="text-2xl font-bold mt-4 text-center" style={{ fontFamily: 'Chalkduster, fantasy' }}>Shipping Information</h2>
                <div className="mt-4 relative">
                  <input 
                    type="text" 
                    name="fullName" 
                    value={shippingInfo.fullName} 
                    onChange={handleShippingChange} 
                    placeholder="Full Name"
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                    required
                  />
                </div>
                <div className="mt-4 relative">
                  <input 
                    type="text" 
                    name="streetAddress" 
                    value={shippingInfo.streetAddress} 
                    onChange={handleShippingChange} 
                    placeholder="Street Address"
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                    required
                  />
                </div>
                <div className="mt-4 relative">
                  <input 
                    type="text" 
                    name="apartment" 
                    value={shippingInfo.apartment} 
                    onChange={handleShippingChange} 
                    placeholder="Apartment, Suite, etc. (optional)"
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                  />
                </div>
                <div className="mt-4 relative">
                  <input 
                    type="text" 
                    name="city" 
                    value={shippingInfo.city} 
                    onChange={handleShippingChange} 
                    placeholder="City"
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                    required
                  />
                </div>
                <div className="mt-4 flex space-x-4">
                  <div className="w-1/3">
                    <input 
                      type="text" 
                      name="state" 
                      value={shippingInfo.state} 
                      onChange={handleShippingChange} 
                      placeholder="State" 
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                      required
                    />
                  </div>
                  <div className="w-1/3">
                    <input 
                      type="text" 
                      name="country" 
                      value={shippingInfo.country} 
                      onChange={handleShippingChange} 
                      placeholder="Country" 
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                      required
                    />
                  </div>
                  <div className="w-1/3">
                    <input 
                      type="text" 
                      name="zip" 
                      value={shippingInfo.zip} 
                      onChange={handleShippingChange} 
                      placeholder="ZIP Code" 
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <button 
                    onClick={handleReturnInfo}
                    className="mt-4 px-8 py-2 border border-white/20 bg-black text-white hover:bg-white hover:text-black transition-colors rounded"
                    style={{ fontFamily: 'Chalkduster, fantasy' }}
                  >
                    Return
                  </button>
                  <button 
                    onClick={handleNext} 
                    className="mt-4 px-8 py-2 bg-white text-black hover:bg-white/90 rounded"
                    style={{ fontFamily: 'Chalkduster, fantasy' }}
                  >
                    Continue to Shipping →	
                  </button>
                </div>
                {errorMessage && (
                  <div className="mt-4 p-2 bg-red-500/20 text-red-300 text-center rounded border border-red-500/40">
                    {errorMessage}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="mb-5">
                <h2 className="text-2xl font-bold mt-4 text-center" style={{ fontFamily: 'Chalkduster, fantasy' }}>Shipping Options</h2>
                <div className="mt-4 flex items-center text-white/60">
                  <p className="mr-2">Ships to:</p>
                  <p className="mr-2">{shippingInfo.streetAddress}, {shippingInfo.city}, {shippingInfo.state}, {shippingInfo.zip}, {shippingInfo.country}</p>
                  <button className="text-white hover:text-white/90 underline" onClick={() => setCurrentStep(1)}>Change</button>
                </div>
                <div className="mt-4">
                  <label className="border border-white/20 p-4 block mb-2 flex items-center rounded hover:bg-white/5 transition-colors cursor-pointer">
                    <input 
                      type="radio" 
                      name="shippingOption" 
                      value="standard" 
                      checked={selectedShippingOption === "standard"} 
                      onChange={() => setSelectedShippingOption("standard")}
                      className="mr-2"
                    />
                    Standard Shipping - $10.00
                  </label>
                  <label className="border border-white/20 p-4 block mb-2 flex items-center rounded hover:bg-white/5 transition-colors cursor-pointer">
                    <input 
                      type="radio" 
                      name="shippingOption" 
                      value="express" 
                      checked={selectedShippingOption === "express"} 
                      onChange={() => setSelectedShippingOption("express")}
                      className="mr-2"
                    />
                    Express Shipping - $20.00
                  </label>
                </div>
                <div className="flex justify-between">
                  <button 
                    onClick={handleReturnShippingPayment}
                    className="mt-4 px-8 py-2 border border-white/20 bg-black text-white hover:bg-white hover:text-black transition-colors rounded"
                    style={{ fontFamily: 'Chalkduster, fantasy' }}
                  >
                    Return
                  </button>
                  <button 
                    onClick={handleNext} 
                    className="mt-4 px-8 py-2 bg-white text-black hover:bg-white/90 rounded"
                    style={{ fontFamily: 'Chalkduster, fantasy' }}
                  >
                    Continue to Payment →	
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="mb-5">
                <div className="mt-4 flex items-center text-white/60">
                  <p className="mr-2">Ships to:</p>
                  <p className="mr-2">{shippingInfo.streetAddress}, {shippingInfo.city}, {shippingInfo.state}, {shippingInfo.zip}, {shippingInfo.country}</p>
                  <button className="text-white hover:text-white/90 underline" onClick={() => setCurrentStep(1)}>Change</button>
                </div>
                <h3 className="text-xl font-bold mt-4 text-center" style={{ fontFamily: 'Chalkduster, fantasy' }}>Billing Address</h3>
                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="sameAsShipping" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCustomerName(shippingInfo.fullName);
                        setShippingAddress(shippingInfo.streetAddress);
                        setCity(shippingInfo.city);
                        setState(shippingInfo.state);
                        const mappedCountry = countryMapping[shippingInfo.country] || "";
                        setBillingCountry(mappedCountry);
                        setBillingPostalCode(shippingInfo.zip);
                      } else {
                        setCustomerName("");
                        setShippingAddress("");
                        setCity("");
                        setState("");
                        setBillingCountry("");
                        setBillingPostalCode("");
                      }
                    }} 
                  />
                  <label htmlFor="sameAsShipping" className="ml-2">Same as Shipping Address</label>
                </div>

                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded mt-2"
                />

                <input
                  type="text"
                  placeholder="Address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded mt-2"
                />
                
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded mt-2"
                />
                <div className="mt-4 flex space-x-4">
                  <div className="w-1/3">
                    <input
                      type="text"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                    />
                  </div>
                  <div className="w-1/3">
                    <select
                      value={billingCountry}
                      onChange={(e) => setBillingCountry(e.target.value)}
                      required
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                    >
                      <option value="">Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="EG">Egypt</option>
                    </select>
                  </div>
                  <div className="w-1/3">
                    <input
                      type="text"
                      placeholder="Zip Code"
                      value={billingPostalCode}
                      onChange={(e) => setBillingPostalCode(e.target.value)}
                      required
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mt-4 text-center" style={{ fontFamily: 'Chalkduster, fantasy' }}>Payment</h2>
                {totalAmount > 0 ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      mode: cart.some(item => item.isSubscription) ? "subscription" : "payment",
                      amount: convertToSubcurrency(total),
                      currency: "usd",
                    }}
                  >
                    <StripePayment 
                      amount={total} 
                      email={contactInfo.email}
                      shippingAddress={shippingInfo.streetAddress}
                      customerName={customerName} 
                      postalCode={shippingInfo.zip}
                      country={billingCountry}
                      isSubscription={cart.some(item => item.isSubscription)}
                      priceId={cart.find(item => item.isSubscription)?.priceID}
                      customer={{ customerId: customerData?.customerId || '' }}
                      cart={cart}
                    />
                    <div className="flex justify-between mt-4">
                      <button 
                        onClick={handleReturnPayment}
                        className="px-8 py-2 border border-white/20 bg-black text-white hover:bg-white hover:text-black transition-colors rounded"
                        style={{ fontFamily: 'Chalkduster, fantasy' }}
                      >
                        Return
                      </button>
                    </div>
                  </Elements>
                ) : (
                  <div className="text-red-500">Your cart is empty. Please add items to your cart before proceeding to payment.</div>
                )}
              </div>
            )}
          </div>
          
          <div className="border-l border-white/20 h-full mx-4 md:hidden"></div>
          
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-bold text-center" style={{ fontFamily: 'Chalkduster, fantasy' }}>Your Cart</h2>
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="text-red-500">Your cart is empty. Please add items to your cart.</div>
              </div>
            ) : (
              <>
                <div className="space-y-4 overflow-y-auto mt-4">
                  {cart.map((item) => (
                    <div key={item.id} className="grid grid-cols-[80px_2fr_1fr_1fr] items-center gap-4 text-sm border border-white/20 rounded-lg p-3">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                      />
                      <div className="grid gap-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <div className="text-xs text-white/60">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.size && item.color && <span> • </span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-sm">{item.quantity}</span>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-sm">${item.price ? item.price.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <h3 
                    className="text-lg font-bold cursor-pointer text-left" 
                    onClick={() => setIsDiscountOpen(!isDiscountOpen)}
                    style={{ fontFamily: 'Chalkduster, fantasy' }}
                  >
                    Promo Code {isDiscountOpen ? '⋁' : '⋀'}
                  </h3>
                  {isDiscountOpen && (
                    <div className="flex items-center mt-2">
                      <input 
                        type="text" 
                        value={discountCode} 
                        onChange={(e) => setDiscountCode(e.target.value)} 
                        placeholder="Enter Promo code" 
                        className={`w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 p-2 rounded ${
                          invalidCoupon ? 'border-red-500' : ''
                        }`}
                      />
                      <button 
                        onClick={handleApplyDiscount} 
                        className="ml-2 px-4 py-2 bg-white text-black hover:bg-white/90 rounded"
                        style={{ fontFamily: 'Chalkduster, fantasy' }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {invalidCoupon && (
                    <div className="mt-2 p-2 bg-red-500/20 text-red-300 text-center rounded border border-red-500/40">
                      A valid coupon is required.
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-white/20 pt-4">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>
                      Taxes {hasTaxException && "(Exempt)"}:
                    </span>
                    <span>${taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>
                      Shipping {hasShippingException && "(Free)"}:
                    </span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-white/60">
                      <span>Discount:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold mt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 