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
          <h4 className="text-primary border-surface-border mb-4 border-b pb-2 text-2xl font-bold">
            {letter}
          </h4>
          <div className="grid gap-4">
            {glossaryData[letter].map((term, index) => (
              <div key={index} className="bg-surface-secondary rounded-lg p-4">
                <h5 className="text-primary mb-2 text-lg font-semibold">
                  {term.term}
                </h5>
                <p className="text-secondary leading-relaxed">
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
