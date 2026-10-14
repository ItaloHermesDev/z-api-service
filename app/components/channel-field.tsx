const fieldClass =
  "h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15";

export function ChannelField({
  channels,
  disabled = false,
  required = true,
}: {
  channels: Array<{ id: string; name: string }>;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      Canal
      {channels.length > 0 ? (
        <select name="channelId" required={required} disabled={disabled} className={fieldClass}>
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          name="channelId"
          required={required}
          disabled={disabled}
          placeholder="Registre o canal em Canais"
          className={`${fieldClass} font-mono text-sm`}
        />
      )}
    </label>
  );
}
