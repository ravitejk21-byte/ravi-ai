/**
 * Quality Gate for AI-generated content
 * Runs checks on generated output and returns a quality report
 */

export interface QualityCheck {
    name: string;
    passed: boolean;
    score: number;
    message?: string;
}

export interface QualityReport {
    score: number;
    passed: boolean;
    checks: QualityCheck[];
    summary: string;
}

/**
 * Run quality gate checks on generated content
 * @param content - The generated content to check
 * @param outputType - The type of output (SLIDES, REPORT, TABLE, etc.)
 * @returns QualityReport with score and individual checks
 */
export async function runQualityGate(
    content: string,
    outputType: string
  ): Promise<QualityReport> {
    const checks: QualityCheck[] = [];

  // Check 1: Minimum length
  const minLength = getMinLength(outputType);
    const lengthPassed = content.length >= minLength;
    checks.push({
          name: "minimum_length",
          passed: lengthPassed,
          score: lengthPassed ? 1.0 : content.length / minLength,
          message: lengthPassed
            ? `Content meets minimum length (${content.length} chars)`
                  : `Content too short: ${content.length}/${minLength} chars`,
    });

  // Check 2: No truncation (doesn't end mid-sentence)
  const lastChar = content.trim().slice(-1);
    const noTruncation = [".", "!", "?", "}", "]", '"', "'"].includes(lastChar);
    checks.push({
          name: "no_truncation",
          passed: noTruncation,
          score: noTruncation ? 1.0 : 0.5,
          message: noTruncation
            ? "Content appears complete"
                  : "Content may be truncated",
    });

  // Check 3: No error markers
  const errorMarkers = ["[ERROR]", "[FAILED]", "undefined", "null", "NaN"];
    const hasErrorMarkers = errorMarkers.some((marker) =>
          content.toUpperCase().includes(marker.toUpperCase())
                                                );
    checks.push({
          name: "no_error_markers",
          passed: !hasErrorMarkers,
          score: hasErrorMarkers ? 0.0 : 1.0,
          message: hasErrorMarkers
            ? "Content contains error markers"
                  : "No error markers found",
    });

  // Check 4: Output type specific checks
  const typeCheck = runTypeSpecificCheck(content, outputType);
    checks.push(typeCheck);

  // Check 5: Coherence - check for repeated sentences
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const uniqueSentences = new Set(sentences.map((s) => s.trim().toLowerCase()));
    const repetitionRatio =
          sentences.length > 0 ? uniqueSentences.size / sentences.length : 1;
    const noExcessiveRepetition = repetitionRatio > 0.7;
    checks.push({
          name: "no_excessive_repetition",
          passed: noExcessiveRepetition,
          score: repetitionRatio,
          message: noExcessiveRepetition
            ? `Content has good variety (${Math.round(repetitionRatio * 100)}% unique sentences)`
                  : `Content has excessive repetition (${Math.round(repetitionRatio * 100)}% unique sentences)`,
    });

  // Calculate overall score (weighted average)
  const weights = [0.2, 0.15, 0.25, 0.25, 0.15];
    const overallScore = checks.reduce(
          (sum, check, i) => sum + check.score * weights[i],
          0
        );

  const passed = overallScore >= 0.6;

  return {
        score: Math.round(overallScore * 100) / 100,
        passed,
        checks,
        summary: passed
          ? `Quality check passed with score ${Math.round(overallScore * 100)}%`
                : `Quality check failed with score ${Math.round(overallScore * 100)}%. Issues: ${checks
                                                                                                           .filter((c) => !c.passed)
                                                                                                           .map((c) => c.name)
                                                                                                           .join(", ")}`,
  };
}

function getMinLength(outputType: string): number {
    const minLengths: Record<string, number> = {
          SLIDES: 200,
          REPORT: 500,
          TABLE: 100,
          MATRIX: 200,
          PLAN: 300,
          PROPOSAL: 400,
          CHARTER: 300,
    };
    return minLengths[outputType] || 100;
}

function runTypeSpecificCheck(content: string, outputType: string): QualityCheck {
    switch (outputType) {
      case "SLIDES": {
              const hasSlideStructure =
                        content.includes("Slide") ||
                        content.includes("##") ||
                        content.includes("**") ||
                        content.includes("•") ||
                        content.includes("-");
              return {
                        name: "type_specific_slides",
                        passed: hasSlideStructure,
                        score: hasSlideStructure ? 1.0 : 0.3,
                        message: hasSlideStructure
                          ? "Slide structure detected"
                                    : "Content lacks slide structure",
              };
      }
      case "REPORT": {
              const hasReportStructure =
                        (content.includes("Executive") || content.includes("Summary")) &&
                        (content.includes("Finding") ||
                                   content.includes("Recommendation") ||
                                   content.includes("Conclusion"));
              return {
                        name: "type_specific_report",
                        passed: hasReportStructure,
                        score: hasReportStructure ? 1.0 : 0.5,
                        message: hasReportStructure
                          ? "Report structure detected"
                                    : "Content may lack standard report structure",
              };
      }
      case "TABLE": {
              const hasTableStructure =
                        content.includes("|") ||
                        content.includes("\t") ||
                        content.includes(",");
              return {
                        name: "type_specific_table",
                        passed: hasTableStructure,
                        score: hasTableStructure ? 1.0 : 0.3,
                        message: hasTableStructure
                          ? "Table structure detected"
                                    : "Content lacks table structure",
              };
      }
      case "MATRIX": {
              const hasMatrixContent =
                        (content.includes("Risk") || content.includes("Control")) &&
                        (content.includes("High") ||
                                   content.includes("Medium") ||
                                   content.includes("Low"));
              return {
                        name: "type_specific_matrix",
                        passed: hasMatrixContent,
                        score: hasMatrixContent ? 1.0 : 0.5,
                        message: hasMatrixContent
                          ? "Risk matrix content detected"
                                    : "Content may lack risk matrix elements",
              };
      }
      default:
              return {
                        name: "type_specific_general",
                        passed: true,
                        score: 1.0,
                        message: "No type-specific checks for this output type",
              };
    }
}
