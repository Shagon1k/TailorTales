export function endsWithCompleteSentence(text: string): boolean {
    return /[.!?…,]$/.test(text.trim());
}
