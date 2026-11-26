export function AccountPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel account-panel" aria-labelledby="account-title">
      <h1 id="account-title">{title}</h1>
      <p className="account-description">{description}</p>
      {children}
    </section>
  );
}
