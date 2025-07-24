import { GlossaryData, GlossaryLetter } from "@/features/glossary/glossary";

interface GlossaryContentProps {
  glossaryData: GlossaryData;
  availableLetters: GlossaryLetter[];
}

export function GlossaryContent({
  glossaryData,
  availableLetters,
}: GlossaryContentProps) {
  return (
    <div className="space-y-4">
      {availableLetters.map((letter) => (
        <div key={letter} id={`letter-${letter}`} className="scroll-mt-4">
          <div className="bg-surface-default flex items-center justify-start px-3 py-2">
            <h4 className="text-primary font-mono text-[13px] font-medium leading-[20px] tracking-[0.06em]">
              {letter}
              <span className="text-link">_</span>
            </h4>{" "}
          </div>
          <div className="divide-border-default flex flex-col divide-y">
            {glossaryData[letter].map((term, index) => (
              <div
                key={index}
                className="bg-surface-secondary grid grid-cols-1 p-3 md:grid-cols-5"
              >
                <h5 className="text-primary font-mono text-[13px] font-medium uppercase leading-[20px] tracking-[0.06em]">
                  {term.title}
                </h5>
                <p className="font-inter text-secondary text-sm font-normal leading-[20px] md:col-span-4">
                  {term.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
