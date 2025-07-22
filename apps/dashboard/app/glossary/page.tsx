import { HeaderSidebar } from "@/widgets";
import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { BookOpen } from "lucide-react";
import { SAMPLE_GLOSSARY_DATA, getAvailableLetters } from "@/features/glossary";

export default function GlossaryPage() {
  // Example usage of the data structure
  const availableLetters = getAvailableLetters(SAMPLE_GLOSSARY_DATA);
  const totalTerms = Object.values(SAMPLE_GLOSSARY_DATA).flat().length;

  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <TheSectionLayout
              title={SECTIONS_CONSTANTS.glossary.title}
              icon={<BookOpen className="section-layout-icon" />}
              description={SECTIONS_CONSTANTS.glossary.description}
              anchorId={SECTIONS_CONSTANTS.glossary.anchorId}
              className="bg-surface-background! mt-[56px]! sm:mt-0!"
            >
              <div className="space-y-6">
                {/* Example: Show available letters */}
                <div>
                  <h3 className="text-primary mb-2 text-lg font-semibold">
                    Available Letters ({totalTerms} total terms):
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableLetters.map((letter) => (
                      <span
                        key={letter}
                        className="bg-surface-primary text-primary rounded px-3 py-1"
                      >
                        {letter} ({SAMPLE_GLOSSARY_DATA[letter].length})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Example: Show terms by letter */}
                <div className="space-y-4">
                  {availableLetters.map((letter) => (
                    <div key={letter}>
                      <h4 className="text-md text-primary mb-2 font-medium">
                        {letter}
                      </h4>
                      <div className="space-y-2">
                        {SAMPLE_GLOSSARY_DATA[letter].map((term, index) => (
                          <div
                            key={index}
                            className="bg-surface-secondary rounded-lg p-3"
                          >
                            <h5 className="text-primary font-semibold">
                              {term.term}
                            </h5>
                            <p className="text-secondary mt-1 text-sm">
                              {term.definition}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TheSectionLayout>
          </div>
        </div>
      </main>
    </div>
  );
}
