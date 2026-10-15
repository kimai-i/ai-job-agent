import { Cormorant_Garamond } from "next/font/google";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["italic", "normal"] });

/** Small-caps "LORD", as printed in the NIV. */
function Lord() {
  return (
    <>
      L<span className="text-[0.78em] tracking-wide">ORD</span>
    </>
  );
}

function Verse({ n }: { n: number }) {
  return (
    <sup className="mr-1.5 font-sans text-[10px] font-semibold text-amber-600 not-italic dark:text-amber-400">{n}</sup>
  );
}

/** A thin flourish with a diamond in the middle. */
function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 text-amber-500/80 dark:text-amber-400/70" aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-current sm:w-28" />
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
        <path d="M12 2 14.5 9.5 22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-current sm:w-28" />
    </div>
  );
}

/** 1 Chronicles 28:19-21 (NIV), shown at the top of the dashboard. */
export function ScriptureBanner() {
  return (
    <figure className="relative mb-8 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50/60 to-rose-50 px-6 py-8 shadow-sm sm:px-12 sm:py-10 dark:border-amber-500/20 dark:from-zinc-900 dark:via-amber-950/20 dark:to-indigo-950/40">
      {/* Soft glows and a large faint quotation mark. */}
      <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -right-20 -bottom-28 size-80 rounded-full bg-rose-300/25 blur-3xl dark:bg-indigo-500/15" />
      <span
        aria-hidden
        className={`${serif.className} pointer-events-none absolute -top-6 left-4 text-[10rem] leading-none text-amber-400/25 select-none sm:left-8 dark:text-amber-300/10`}
      >
        &ldquo;
      </span>

      <div className="relative mx-auto max-w-3xl text-center">
        <Ornament />

        <blockquote
          className={`${serif.className} mt-6 space-y-3 text-[1.2rem] leading-relaxed text-zinc-800 italic sm:text-[1.35rem] dark:text-zinc-200`}
        >
          <p>
            <Verse n={19} />
            &ldquo;All this,&rdquo; David said, &ldquo;I have in writing as a result of the <Lord />
            &rsquo;s hand on me, and he enabled me to understand all the details of the plan.&rdquo;
          </p>
          <p>
            <Verse n={20} />
            David also said to Solomon his son,{" "}
            <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600 bg-clip-text text-[1.12em] font-semibold text-transparent not-italic dark:from-amber-300 dark:via-orange-300 dark:to-rose-300">
              &ldquo;Be strong and courageous, and do the work.
            </span>{" "}
            Do not be afraid or discouraged, for the <Lord /> God, my God, is with you. He will not fail you or forsake
            you until all the work for the service of the temple of the <Lord /> is finished.
          </p>
          <p>
            <Verse n={21} />
            The divisions of the priests and Levites are ready for all the work on the temple of God, and every willing
            person skilled in any craft will help you in all the work. The officials and all the people will obey your
            every command.&rdquo;
          </p>
        </blockquote>

        <figcaption className="mt-7 space-y-3">
          <Ornament />
          <p className="text-[11px] font-semibold tracking-[0.3em] text-amber-800 uppercase dark:text-amber-300">
            1 Chronicles 28:19&ndash;21 &middot; NIV
          </p>
        </figcaption>
      </div>
    </figure>
  );
}
