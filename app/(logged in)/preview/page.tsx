import PreviewClient from "./PreviewClient";

export default function PreviewPage() {
    return (
        <main className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-8 text-center">Kommende Zeiten</h1>
            <PreviewClient />
        </main>
    );
}
