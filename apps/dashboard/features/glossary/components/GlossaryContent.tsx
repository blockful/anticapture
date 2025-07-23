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
    <div className="space-y-8">
      {availableLetters.map((letter) => (
        <div key={letter} id={`letter-${letter}`} className="scroll-mt-4">
          <div className="bg-surface-default flex items-center justify-start px-3 py-2">
            <h4 className="text-primary font-bold">
              {letter} <span className="text-link">_</span>
            </h4>{" "}
          </div>
          <div className="divide-border-default flex flex-col divide-y">
            {glossaryData[letter].map((term, index) => (
              <div
                key={index}
                className="bg-surface-secondary grid grid-cols-5 p-4"
              >
                <h5 className="text-primary font-roboto-mono text-[13px] font-medium uppercase leading-[20px] tracking-[0.78px]">
                  {term.term}
                </h5>
                <p
                  className="font-inter text-secondary col-span-4 text-[14px] font-normal leading-[20px]"
                  style={{ fontStyle: "normal" }}
                >
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
