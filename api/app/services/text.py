"""Language-light text helpers used by the matching engine and the email checker."""
from __future__ import annotations

import math
import re
from collections import Counter

_WORD_RE = re.compile(r"[a-z0-9][a-z0-9+#.\-]*[a-z0-9+#]|[a-z0-9]", re.IGNORECASE)
# CJK scripts have no spaces — use character bigrams so Korean/Japanese/Chinese profiles still overlap.
_CJK_RE = re.compile(r"[぀-ヿ㐀-䶿一-鿿가-힯]+")

STOPWORDS = frozenset(
    """a an and are as at be but by for from has have i in is it its of on or our that the their this to was we
    with you your will can able using use used work working experience student students research project projects
    interest interested learn learning skills skill including etc via new also more most into out over under about""".split()
)

# Common short forms → canonical skill/topic names.
ALIASES = {
    "ml": "machine learning", "dl": "deep learning", "ai": "artificial intelligence", "nlp": "natural language processing",
    "cv": "computer vision", "rl": "reinforcement learning", "js": "javascript", "ts": "typescript", "py": "python",
    "tf": "tensorflow", "sklearn": "scikit-learn", "stats": "statistics", "bioinfo": "bioinformatics",
    "comp bio": "computational biology", "neuro": "neuroscience", "hci": "human-computer interaction",
    "llm": "large language models", "llms": "large language models", "matlab": "matlab", "cpp": "c++",
    "torch": "pytorch", "pandas": "pandas", "numpy": "numpy", "r": "r", "excel": "excel",
}


def split_list(value: str | None) -> list[str]:
    """'Python, R; PyTorch / SQL' → ['python', 'r', 'pytorch', 'sql'] (aliases expanded, de-duplicated)."""
    if not value:
        return []
    out: list[str] = []
    for raw in re.split(r"[,;\n/|•·]+", value):
        item = re.sub(r"\s+", " ", raw.strip().lower()).strip(" .-")
        if not item:
            continue
        item = ALIASES.get(item, item)
        if item not in out:
            out.append(item)
    return out


def _stem(word: str) -> str:
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 4 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def tokens(text: str | None) -> list[str]:
    """Unigrams + adjacent bigrams (so 'computer vision' counts as a phrase) + CJK character bigrams."""
    if not text:
        return []
    text = text.lower()
    out: list[str] = []
    words = [_stem(w) for w in _WORD_RE.findall(text)]
    words = [ALIASES.get(w, w) for w in words]
    kept = [w for w in words if w not in STOPWORDS and len(w) > 1]
    out.extend(kept)
    out.extend(f"{a}_{b}" for a, b in zip(kept, kept[1:]))
    for run in _CJK_RE.findall(text):
        if len(run) == 1:
            out.append(run)
        out.extend(run[i : i + 2] for i in range(len(run) - 1))
    return out


class TfIdf:
    """Small TF-IDF model built over a corpus of token lists."""

    def __init__(self, docs: list[list[str]]):
        n = len(docs)
        df: Counter[str] = Counter()
        for d in docs:
            df.update(set(d))
        self.idf = {t: math.log((1 + n) / (1 + c)) + 1 for t, c in df.items()}
        self._default = math.log(1 + n) + 1

    def vector(self, toks: list[str]) -> dict[str, float]:
        tf = Counter(toks)
        vec = {t: (1 + math.log(c)) * self.idf.get(t, self._default) for t, c in tf.items()}
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        return {t: v / norm for t, v in vec.items()}


def cosine(a: dict[str, float], b: dict[str, float]) -> float:
    if len(a) > len(b):
        a, b = b, a
    return sum(v * b.get(t, 0.0) for t, v in a.items())


def shared_terms(a: list[str], b: list[str], limit: int = 5) -> list[str]:
    """Human-readable overlapping topics (phrases first), for explaining a match."""
    sa, sb = set(a), set(b)
    common = sa & sb
    phrases = sorted((t.replace("_", " ") for t in common if "_" in t), key=lambda s: (-len(s), s))
    words = sorted(t for t in common if "_" not in t and not _CJK_RE.fullmatch(t))
    out: list[str] = []
    for item in phrases + words:
        # skip a word already covered by a chosen phrase
        if any(item in p for p in out):
            continue
        out.append(item)
        if len(out) >= limit:
            break
    return out


def snippet(text: str | None, n: int = 280) -> str | None:
    if not text:
        return None
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def skills_overlap(needed: list[str], have: list[str]) -> tuple[list[str], list[str]]:
    """(covered, missing) — a needed skill is covered by an exact or whole-word containment match."""
    covered: list[str] = []
    missing: list[str] = []
    for need in needed:
        hit = False
        for h in have:
            if need == h or re.search(rf"(?<![a-z0-9]){re.escape(need)}(?![a-z0-9])", h) or re.search(
                rf"(?<![a-z0-9]){re.escape(h)}(?![a-z0-9])", need
            ):
                hit = True
                break
        (covered if hit else missing).append(need)
    return covered, missing
