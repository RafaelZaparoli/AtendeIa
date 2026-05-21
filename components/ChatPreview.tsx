const messages = [
  {
    from: "Cliente",
    text: "Oi! Voces fazem limpeza de sofa? Qual o valor?"
  },
  {
    from: "AtendeAI",
    text: "Fazemos sim. A limpeza de sofa com ate 3 lugares sai por R$ 160 e pode ser agendada de segunda a sabado."
  },
  {
    from: "Cliente",
    text: "Tem horario amanha de manha?"
  },
  {
    from: "AtendeAI",
    text: "Amanha temos 9h30 ou 11h. Posso reservar um desses horarios para voce?"
  }
];

export function ChatPreview() {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
        <div>
          <p className="text-sm font-semibold text-ink">Demo de conversa</p>
          <p className="text-xs text-ink/55">Resposta baseada nas regras da empresa</p>
        </div>
        <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-moss">
          Online
        </span>
      </div>
      <div className="space-y-3">
        {messages.map((message) => {
          const isAi = message.from === "AtendeAI";

          return (
            <div
              key={message.text}
              className={`flex ${isAi ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
                  isAi
                    ? "bg-cloud text-ink"
                    : "bg-ink text-white"
                }`}
              >
                <p className="mb-1 text-xs font-semibold opacity-70">{message.from}</p>
                <p>{message.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
