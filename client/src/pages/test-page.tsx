import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import MortgageTest from "@/tests/MortgageTest";

export default function TestPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6">Test Page</h1>
          <p className="mb-8">
            This page is for testing and debugging components. You can see detailed information about your mortgages below.
          </p>
          
          <MortgageTest />
        </div>
      </main>
      <Footer />
    </div>
  );
}