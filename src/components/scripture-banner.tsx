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
  return <sup className="mr-0.5 ml-1 font-sans text-[9px] font-semibold text-pink-400 not-italic">{n}</sup>;
}

/** 1 Chronicles 28:19-21 (NIV): a slim black-and-pink strip at the top of the dashboard. */
export function ScriptureBanner() {
  return (
    <figure className="relative mb-6 overflow-hidden rounded-xl border border-pink-500/30 bg-zinc-950 px-4 py-3 shadow-sm sm:px-5">
      {/* Soft pink glows. */}
      <div className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full bg-pink-500/25 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-12 size-32 rounded-full bg-pink-400/20 blur-2xl" />

      <div className="relative flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
        <blockquote
          className={`${serif.className} flex-1 text-[0.95rem] leading-snug text-zinc-300 italic`}
        >
          <Verse n={19} />
          &ldquo;All this,&rdquo; David said, &ldquo;I have in writing as a result of the <Lord />
          &rsquo;s hand on me, and he enabled me to understand all the details of the plan.&rdquo;
          <Verse n={20} />
          David also said to Solomon his son,{" "}
          <span className="font-semibold text-pink-400 not-italic">
            &ldquo;Be strong and courageous, and do the work.
          </span>{" "}
          Do not be afraid or discouraged, for the <Lord /> God, my God, is with you. He will not fail you or forsake
          you until all the work for the service of the temple of the <Lord /> is finished.
          <Verse n={21} />
          The divisions of the priests and Levites are ready for all the work on the temple of God, and every willing
          person skilled in any craft will help you in all the work. The officials and all the people will obey your
          every command.&rdquo;
        </blockquote>

        <figcaption className="flex shrink-0 items-center gap-2 text-[10px] font-semibold tracking-[0.25em] whitespace-nowrap text-pink-300 uppercase md:border-l md:border-pink-500/30 md:pl-5">
          <svg viewBox="0 0 24 24" className="size-3 text-pink-400" fill="currentColor" aria-hidden>
            <path d="M12 2 14.5 9.5 22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />
          </svg>
          1 Chr 28:19&ndash;21 &middot; NIV
        </figcaption>
      </div>
    </figure>
  );
}
