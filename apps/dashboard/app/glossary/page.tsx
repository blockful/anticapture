import { HeaderSidebar } from "@/widgets";
import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { BookOpen } from "lucide-react";
import {
  SAMPLE_GLOSSARY_DATA,
  getAvailableLetters,
  GlossaryKeyboard,
} from "@/features/glossary";

export default function GlossaryPage() {
  const availableLetters = getAvailableLetters(SAMPLE_GLOSSARY_DATA);

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
              <div className="flex gap-8">
                {/* Sticky Keyboard - Left Side */}
                <div className="w-80 flex-shrink-0">
                  <div className="sticky top-4">
                    <GlossaryKeyboard glossaryData={SAMPLE_GLOSSARY_DATA} />
                  </div>
                </div>

                {/* Glossary Content - Right Side */}
                <div className="min-w-0 flex-1">
                  <div className="space-y-8">
                    {availableLetters.map((letter) => (
                      <div
                        key={letter}
                        id={`letter-${letter}`}
                        className="scroll-mt-4"
                      >
                        <h4 className="text-primary border-surface-border mb-4 border-b pb-2 text-2xl font-bold">
                          {letter}
                        </h4>
                        <div className="grid gap-4">
                          {SAMPLE_GLOSSARY_DATA[letter].map((term, index) => (
                            <div
                              key={index}
                              className="bg-surface-secondary rounded-lg p-4"
                            >
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
                </div>
              </div>
            </TheSectionLayout>
          </div>
        </div>
      </main>
    </div>
  );
}
