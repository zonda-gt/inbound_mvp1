"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { REDDIT_QUOTES } from "@/lib/esim-constants";

export default function RedditQuotesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Real Traveler Experiences
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            What actual travelers from Reddit&apos;s <strong>r/travelchina</strong> community had to say:
          </p>

          <div className="space-y-3">
            {REDDIT_QUOTES.map((quote, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-start gap-3 bg-card rounded-lg border border-border border-l-4 border-l-[#ff4500] p-4"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6314] to-[#ff4500] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {quote.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#ff4500] mb-1">{quote.user}</p>
                  <p className="text-sm text-foreground/80 italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
