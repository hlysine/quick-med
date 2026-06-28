import { memo } from 'react';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default memo(function PWAPrompt() {
  const { needRefresh, updateServiceWorker } = useRegisterSW();
  const [refresh, setRefresh] = needRefresh;
  if (!refresh) return null;
  return (
    <button
      type="button"
      className="btn btn-square btn-ghost text-primary"
      onClick={async () => {
        const newLocation = `${window.location.origin}${window.location.pathname}`;
        window.history.pushState(null, '', newLocation);
        await updateServiceWorker(true);
        setRefresh(false);
      }}
    >
      <FaCloudDownloadAlt size={24} />
    </button>
  );
});
