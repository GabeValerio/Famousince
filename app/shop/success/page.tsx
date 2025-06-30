export default function PaymentSuccess({
  searchParams: { amount },
}: {
  searchParams: { amount: string };
}) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full mx-auto border border-white/20 rounded-lg p-8 bg-black">
          <div className="text-center space-y-4">
            <h1 
              className="text-4xl font-bold"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              Thank you!
            </h1>
            <h2 className="text-xl text-white/60">You successfully sent</h2>

            <div className="mt-6 text-5xl font-bold" style={{ fontFamily: 'Chalkduster, fantasy' }}>
              ${amount}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}