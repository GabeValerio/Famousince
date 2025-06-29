import ImageGenerator from '../../components/ImageGenerator';

export default function MockUpPage() {
  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <div className="container mx-auto h-full px-4 py-4">
        <h1 
          className="text-2xl font-bold mb-2 text-center"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          T-Shirt Text Generator
        </h1>
        <div className="h-[calc(100%-3rem)]">
          <ImageGenerator />
        </div>
      </div>
    </div>
  );
}
