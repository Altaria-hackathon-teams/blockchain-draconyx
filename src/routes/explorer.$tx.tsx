import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { getEvidenceByTxHash, type EvidenceRecord } from "@/lib/storage";
import { ExternalLink, CheckCircle2, PackageSearch, LayoutPanelLeft, Clock, Code2, Database } from "lucide-react";
import { ipfsGatewayUrl, shortHash } from "@/lib/crypto";

export const Route = createFileRoute("/explorer/$tx")({
  head: () => ({ meta: [{ title: "Polygonscan Simulation — SilentWitness" }] }),
  component: ExplorerPage,
});

function ExplorerPage() {
  const { tx } = useParams({ from: "/explorer/$tx" });
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate network delay for realism
    const timer = setTimeout(() => {
      const r = getEvidenceByTxHash(tx);
      setRecord(r || null);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [tx]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Mock Polygonscan Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded bg-[#8247E5] text-white">
              <PackageSearch className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-800">
              Polygonscan <span className="text-sm font-normal text-zinc-500">(Amoy Testnet Mock)</span>
            </span>
          </div>
          <div className="ml-auto hidden md:block">
            <Link to="/" className="text-sm font-medium text-[#8247E5] hover:underline">
              Back to SilentWitness
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Transaction Details</h1>
        </div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#8247E5]"></div>
            <p className="mt-4 text-sm text-zinc-500">Searching for transaction...</p>
          </div>
        ) : !record ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">
            <PackageSearch className="mb-4 h-12 w-12 text-zinc-300" />
            <h2 className="text-lg font-medium text-zinc-800">Transaction Not Found</h2>
            <p className="mt-2 max-w-sm text-sm">
              We could not find the transaction hash ({tx}) in the internal memory storage. Are you sure you captured it on this device?
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-6 py-4">
              <h2 className="text-lg font-medium">Overview</h2>
            </div>
            
            <div className="divide-y divide-zinc-100">
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4 md:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 md:col-span-1">
                  <PackageSearch className="h-4 w-4" /> Transaction Hash:
                </div>
                <div className="md:col-span-3">
                  <span className="font-mono text-sm break-all">{record.txHash}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4 md:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 md:col-span-1">
                  Status:
                </div>
                <div className="md:col-span-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Success
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4 md:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 md:col-span-1">
                  <LayoutPanelLeft className="h-4 w-4" /> Block:
                </div>
                <div className="md:col-span-3">
                  <span className="text-sm font-medium text-[#8247E5]">{record.blockNumber}</span>
                  <span className="ml-2 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-500">
                    42 Block Confirmations
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4 md:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 md:col-span-1">
                  <Clock className="h-4 w-4" /> Timestamp:
                </div>
                <div className="md:col-span-3 text-sm">
                  {new Date(record.timestamp).toUTCString()} ({((Date.now() - record.timestamp)/1000/60).toFixed(0)} mins ago)
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4 md:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 md:col-span-1">
                  From:
                </div>
                <div className="md:col-span-3 text-sm font-mono text-[#8247E5]">
                  0xSilentWitnessSmartContractApp0000000000
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4 md:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 md:col-span-1">
                  To:
                </div>
                <div className="md:col-span-3 text-sm font-mono text-[#8247E5]">
                  {record.sbt?.contract || "0x517B0bC1d8A5f2C5F0e8e0d6c5A3A0B0D9F0aA01"} (SilentWitness SBT Registry)
                </div>
              </div>

              <hr className="my-2 border-zinc-200" />

              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4 md:items-start">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 md:col-span-1">
                  <Database className="h-4 w-4" /> Input Data (IPFS Hash):
                </div>
                <div className="md:col-span-3">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <p className="mb-2 text-xs text-zinc-500">
                      The blockchain stores the cryptographic IPFS hash and File Hash to prove authenticity, rather than the file itself.
                    </p>
                    <div className="font-mono text-sm text-zinc-700 break-all">
                      <span className="font-semibold text-zinc-900">Original SHA-256 Hash:</span> {record.hash}<br/><br/>
                      <span className="font-semibold text-zinc-900">Decentralized IPFS CID:</span> {record.cid}
                    </div>
                    <div className="mt-4">
                      <a 
                        href={ipfsGatewayUrl(record.cid)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded bg-[#8247E5] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#6c39bf]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Uploaded Source File via IPFS
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
