import Spinner from "./Spinner";

export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex h-60 w-full items-center justify-center gap-3 text-muted-foreground">
      <Spinner size="lg" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
