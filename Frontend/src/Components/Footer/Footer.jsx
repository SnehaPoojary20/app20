import "./Footer.css";

export default function Footer() {
  return (
    <footer className="ft">
      <div>
        <strong>
          RED<b>LINE</b>
        </strong>
        <p>Decision support for UK day-ahead wind procurement. It informs a human decision; it does not trade.</p>
      </div>
      <div className="ft-src">
        <span>Data</span>
        <p>Elexon BMRS · FUELHH (actual wind) · WINDFOR (forecast) · half-hourly, national</p>
        <p>Window: January 2026 · Times shown in GMT</p>
      </div>
      <div className="ft-src">
        <span>Method</span>
        <p>Error = forecast − actual · MAE, RMSE, bias on matched periods · wMAPE avoids near-zero blow-ups</p>
      </div>
    </footer>
  );
}
