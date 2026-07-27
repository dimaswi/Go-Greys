import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { resolveAssetUrl } from '@/lib/runtime';

interface SiteConfig {
  app_name: string;
  subtitle: string;
  logo_url: string;
  favicon_url: string;
}

interface SiteConfigContextType {
  config: SiteConfig;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const defaultConfig: SiteConfig = {
  app_name: "Greys Dental",
  subtitle: "Aplikasi Manajemen",
  logo_url: "",
  favicon_url: "/favicon.svg",
};

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: defaultConfig,
  loading: true,
  refreshConfig: async () => {},
});

export const useSiteConfig = () => useContext(SiteConfigContext);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const refreshConfig = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const res = await axios.get(`${API_URL}/site-config`);
      if (res.data) {
        setConfig(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch site config", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  // Effect to update favicon dynamically
  useEffect(() => {
    if (config.favicon_url) {
      const url = resolveAssetUrl(config.favicon_url);
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = url;
    }
  }, [config.favicon_url]);

  return (
    <SiteConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
};
