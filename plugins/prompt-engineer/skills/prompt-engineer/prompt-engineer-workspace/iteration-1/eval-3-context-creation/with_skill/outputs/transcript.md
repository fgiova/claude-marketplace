# Prompt Engineer - Conversation Transcript

## Eval 3: Context Creation (Full Mode)

---

### Step 0: Mode Selection

**Assistant:** Ciao! Vedo che vuoi creare un prompt. Prima di iniziare, quale modalita preferisci?

- **Full mode** - Tutte e 6 le fasi. Ideale per prompt complessi e ad alto impatto.
- **Quick mode** - Solo le fasi 1, 4 e 6 (Task, Brief, Conversation). Piu veloce, per prompt semplici.

**User:** Full mode.

**Assistant:** Perfetto, partiamo con il Full mode. Procederemo fase per fase.

---

### Phase 1: Task

**Assistant:** Definisci il tuo obiettivo usando questo formato:

> "I want to [TASK] so that [SUCCESS CRITERIA]."

Cosa vuoi che il prompt faccia e come si misura il successo?

**User:** I want to generate API documentation from OpenAPI specs so that developers can integrate our APIs in under 30 minutes without asking for help.

**Assistant:** Ottimo. Il task e chiaro e misurabile:
- **Task:** Generate API documentation from OpenAPI specs
- **Success criteria:** Developers can integrate the APIs in under 30 minutes without asking for help

Questo e un task ben definito: specifico (documentazione API da spec OpenAPI), con un criterio di successo concreto (integrazione in meno di 30 minuti, senza assistenza). Procediamo alla Phase 2.

---

### Phase 2: Context Files

**Assistant:** Hai dei file di contesto esistenti (standard, linee guida, regole di tono, profili del pubblico) che dovrebbero informare questo prompt?

**User:** No, non ho file di contesto esistenti.

**Assistant:** Nessun problema, li creeremo insieme. Raccontami:

1. **Standard e regole di qualita** - Cosa rende "buona" la documentazione per te?
2. **Vincoli e cose da evitare** - Cosa non deve assolutamente contenere?
3. **Pubblico target** - Chi legge l'output e cosa gli interessa?
4. **Tono e voce** - Come deve suonare?
5. **Terminologia specifica** - Convenzioni di dominio?

**User:**
- Standards: every endpoint must have a working curl example, error codes must be documented, use plain English not jargon.
- Constraints: no internal implementation details, no deprecated endpoints.
- Audience: external developers, varying skill levels.
- Tone: friendly but precise, tutorial-style.

**Assistant:** Perfetto. Ho raccolto tutto il contesto necessario. Creo il file `context.md` con queste informazioni organizzate in sezioni chiare.

*[Context file generated and saved - see context.md]*

Il file di contesto e stato creato. Contiene tutte le regole, i vincoli, il profilo del pubblico e le indicazioni di tono. Procediamo alla Phase 3.

---

### Phase 3: Reference

**Assistant:** Hai un esempio di riferimento - qualcosa che assomiglia a cio che vuoi che il prompt produca?

**User:** No, non ho un riferimento. Skip.

**Assistant:** Nessun problema, saltiamo questa fase. Il Brief nella prossima fase catturera abbastanza informazioni per guidare il prompt. Procediamo alla Phase 4.

---

### Phase 4: Brief (SUCCESS BRIEF)

**Assistant:** Ora costruiamo il SUCCESS BRIEF. Ti faro una domanda alla volta.

**Domanda 1:** Che tipo di output deve produrre il prompt? (es. contratto, memo, report, landing page, email, codice) E approssimativamente quanto lungo?

**User:** API docs page, circa 500 words per endpoint.

**Assistant:** Perfetto.

**Domanda 2:** Dopo aver letto l'output, cosa dovrebbe pensare, sentire o fare il destinatario?

**User:** The developer should think "I can start coding now."

**Assistant:** Chiaro e diretto.

**Domanda 3:** A cosa NON deve assomigliare l'output? (es. AI generico, troppo casual, troppo formale, pieno di gergo, commerciale)

**User:** It should NOT sound like auto-generated swagger UI or dry spec language.

**Assistant:** Ottimo contrasto.

**Domanda 4:** Quale risultato concreto definisce il successo? (es. firmano il contratto, approvano la proposta, rispondono, fanno un'azione specifica)

**User:** A developer makes a successful API call within 10 minutes of reading.

**Assistant:** Il SUCCESS BRIEF e completo:
- **Type + length:** API docs page, ~500 words per endpoint
- **Reaction:** Developer thinks "I can start coding now"
- **Does NOT sound like:** Auto-generated swagger UI, dry spec language
- **Success means:** Developer makes a successful API call within 10 minutes of reading

Procediamo alla Phase 5.

---

### Phase 5: Rules

**Assistant:** Questa fase collega il file di contesto al prompt. Non serve input - assemblo la sezione delle regole che istruisce l'AI a:
- Leggere completamente il file di contesto prima di iniziare
- Fermarsi e segnalare se sta per violare una regola dal file di contesto
- Trattare il file di contesto come fonte di verita per standard, vincoli e pubblico

*[Rules section assembled]*

Procediamo alla Phase 6.

---

### Phase 6: Conversation

**Assistant:** Quest'ultima fase aggiunge le istruzioni per il raffinamento collaborativo. Non serve input - aggiungo le istruzioni di chiusura:
- NON iniziare a eseguire ancora
- Fare domande di chiarimento per raffinare l'approccio passo dopo passo
- Prima di scrivere qualsiasi cosa, elencare le 3 regole piu rilevanti dal file di contesto
- Presentare un piano di esecuzione (massimo 5 passaggi)
- Iniziare il lavoro solo una volta confermato l'allineamento

*[Conversation section assembled]*

---

### Final Assembly

**Assistant:** Tutte e 6 le fasi sono complete. Ho assemblato il prompt finale in inglese. Puoi trovarlo in `prompt.md`.

Il prompt include:
1. Il task statement con criteri di successo
2. Riferimento al file di contesto
3. Il SUCCESS BRIEF completo
4. Le regole per il rispetto del contesto
5. Le istruzioni di conversazione collaborativa

Il file di contesto `context.md` e stato generato e salvato separatamente.
