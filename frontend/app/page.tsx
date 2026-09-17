"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Bot, Handshake, Zap } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

const DummyFeatureContent = ({ title, text }: { title: string, text: string }) => {
  return (
    <div className="bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <p className="text-neutral-300 text-base md:text-xl font-sans max-w-3xl mx-auto mb-8">
        <span className="font-bold text-white block mb-2">{title}</span>
        {text}
      </p>
      <img
        src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=3474&auto=format&fit=crop"
        alt="Trading Dashboard"
        height="500"
        width="500"
        className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain rounded-xl shadow-2xl"
      />
    </div>
  );
};

const carouselData = [
  {
    category: "Unbiased",
    title: "Cut Through the Noise",
    src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=3540&auto=format&fit=crop",
    content: <DummyFeatureContent title="Eliminate Emotional Bias" text="Most analysts have an ulterior motive. Our Bull and Bear agents are programmed to attack the underlying fundamentals from complete opposite extremes. This exposes the hidden risks and catalysts that a single human analyst might miss." />,
  },
  {
    category: "Speed",
    title: "Make Decisions Faster",
    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=3540&auto=format&fit=crop",
    content: <DummyFeatureContent title="Instant Fundamental Data" text="Instead of spending hours reading Yahoo Finance, checking technicals on TradingView, and reading news sentiment... our AI fetches the live data instantly. Let the Judge evaluate the debate and provide a confident BUY, SELL, or HOLD verdict in seconds." />,
  },
  {
    category: "AI Powered",
    title: "Multi-Agent Architecture",
    src: "https://images.unsplash.com/photo-1620712948343-00842a5a81ca?q=80&w=3540&auto=format&fit=crop",
    content: <DummyFeatureContent title="LLM Roleplay" text="Four distinct AI personas debate live financial data in real-time, executing thousands of tokens sequentially to simulate a war room of financial analysts working directly for you." />,
  },
];

const testimonials = [
  {
    quote:
      "The debate structure makes it so much easier to see the hidden risks unmentioned by traditional analysis. This is exactly what I've been looking for.",
    name: "Sarah Chen",
    designation: "Retail Investor",
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "I love watching the Bull and Bear agents battle it out. The instant Groq generation feels like absolute magic. Implementation was seamless.",
    name: "Michael Rodriguez",
    designation: "Day Trader",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "Having a neutral Judge agent distill the noise into a simple BUY/SELL decision is incredibly valuable. This solution has significantly improved our team's productivity.",
    name: "Emily Watson",
    designation: "Portfolio Manager",
    src: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "StockDebate removed all the emotion out of my investing strategy. Pure, fundamentals-based AI analysis. Outstanding support and robust features.",
    name: "David Kim",
    designation: "Swing Trader",
    src: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "I usually dread reading financial ratios, but the personas make it so intuitive and easy to digest. Game-changing scalability.",
    name: "Sarah Jenkins",
    designation: "Beginner",
    src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black/[0.96] antialiased">
      {/* Background Dots */}
      <div
        className="pointer-events-none absolute inset-0 [background-size:40px_40px] select-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)",
        }}
      />

      <Spotlight className="-top-10 left-0 md:top-10 md:left-[20%]" fill="white" />

      {/* Navigation */}
      <nav className="relative z-10 flex w-full items-center justify-between p-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
            <Handshake size={18} />
          </div>
          <span className="font-display text-lg font-bold text-white tracking-wide">
            StockDebate
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center p-4 mt-20 md:mt-32">
        <div className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-300 mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-[var(--accent)] mr-2 animate-pulse" />
          Powered by Llama 3 & Groq Fast Inference
        </div>

        <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-5xl font-bold text-transparent md:text-8xl tracking-tight mb-6">
          Invest with <br /> <span className="text-[var(--accent)]">Absolute</span> Clarity.
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-center text-lg font-normal text-neutral-400 md:text-xl">
          Watch AI Agent personas—Bull, Bear, and Neutral—ruthlessly debate real-time market data to forge an unbiased investment verdict for any stock in seconds.
        </p>

        <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row">
          <Link
            href="/debate"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-white px-8 font-medium text-black transition-all hover:scale-105 active:scale-95"
          >
            <span>Start a Debate</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-24 grid grid-cols-1 gap-6 md:grid-cols-3 w-full max-w-5xl px-4">
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 p-8 transition-all duration-300 hover:border-neutral-600 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--bull)]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <Bot className="relative z-10 mb-5 h-10 w-10 text-[var(--bull)] transition-transform duration-300 group-hover:scale-110" />
            <h3 className="relative z-10 mb-3 text-xl font-bold text-white transition-colors group-hover:text-[var(--bull)]">Multi-Agent Debate</h3>
            <p className="relative z-10 text-sm leading-relaxed text-neutral-400">Bull and Bear agents present aggressive counter-arguments backed by live financial fundamentals.</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 p-8 transition-all duration-300 hover:border-neutral-600 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <Zap className="relative z-10 mb-5 h-10 w-10 text-[var(--accent)] transition-transform duration-300 group-hover:scale-110" />
            <h3 className="relative z-10 mb-3 text-xl font-bold text-white transition-colors group-hover:text-[var(--accent)]">Groq Millisecond Speeds</h3>
            <p className="relative z-10 text-sm leading-relaxed text-neutral-400">Leverage LPU technology to watch the complex debate unfold in real-time without latency.</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 p-8 transition-all duration-300 hover:border-neutral-600 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--judge)]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <Handshake className="relative z-10 mb-5 h-10 w-10 text-[var(--judge)] transition-transform duration-300 group-hover:scale-110" />
            <h3 className="relative z-10 mb-3 text-xl font-bold text-white transition-colors group-hover:text-[var(--judge)]">Unbiased Verdicts</h3>
            <p className="relative z-10 text-sm leading-relaxed text-neutral-400">A senior Judge AI agent synthesizes the entire debate into a final, data-backed BUY or SELL decision.</p>
          </div>
        </div>

        {/* Why Stock Debate Section (Apple Cards Carousel) */}
        <div className="w-full h-full py-20 mt-16 max-w-7xl mx-auto">
          <div className="text-center mb-8 px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Why Use StockDebate?</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              The stock market is flooded with biased opinions, emotional trading, and endless noise.
            </p>
          </div>
          <Carousel items={carouselData.map((card, index) => <Card key={card.src} card={card} index={index} />)} />
        </div>

        {/* Testimonials */}
        <div className="w-full mt-24 mb-16 px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Loved by Investors</h2>
            <p className="text-neutral-400">See what happens when you cut out the emotion and let the data decide.</p>
          </div>
          <AnimatedTestimonials testimonials={testimonials} autoplay={true} />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800 bg-black/[0.96] py-12 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent)] text-white">
              <Handshake size={14} />
            </div>
            <span className="font-display text-sm font-bold text-white tracking-wide">
              StockDebate System
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} StockDebate System. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-neutral-500 hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="text-sm text-neutral-500 hover:text-white transition-colors">GitHub</Link>
            <Link href="#" className="text-sm text-neutral-500 hover:text-white transition-colors">Discord</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
