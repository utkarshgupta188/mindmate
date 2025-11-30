/**
 * Compute stress value (0-100) from multiple signals
 */
export function computeStressValue(
    sentLabel: string | undefined,
    sentConf: number | undefined,
    arousal: string | undefined,
    webVA: { valence?: string; arousal?: string } | null,
    webConf?: number
) {
    // base neutral
    let score = 50

    // sentiment
    if (sentLabel === 'negative') score += 20
    if (sentLabel === 'positive') score -= 10

    // confidence amplifies
    const conf = typeof sentConf === 'number' ? sentConf : 0.6
    score = score * (1 + (conf - 0.5) * 0.4) // small amplification

    // arousal (text)
    if (arousal === 'high') score += 15
    if (arousal === 'low') score -= 8

    // webcam valence/arousal adds signal
    if (webVA) {
        if (webVA.valence === 'negative') score += 12
        if (webVA.arousal === 'high') score += 10
        if (webVA.valence === 'positive') score -= 8
    }

    // webcam confidence dampens/strengthens
    if (webConf) score = score * (1 + Math.min(0.25, (webConf - 0.5) * 0.5))

    // clamp
    score = Math.max(0, Math.min(100, Math.round(score)))
    return score
}
