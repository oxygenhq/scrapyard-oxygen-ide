using Microsoft.Win32;
using SHDocVw;
using System;
using System.Runtime.InteropServices;
using mshtml;
using System.Windows;
using System.Net;
using System.Collections.Generic;

namespace CloudBeat.IEAddon
{
	[ComVisible(true)]
	[ClassInterface(ClassInterfaceType.None)]
    [Guid("D8FAF7A1-1D88-11E2-AE2C-001C230C8ABD")]
	[ProgId("CloudBeat.IEAddon")]
    public class RecorderExtension : IObjectWithSite, IOleCommandTarget {
        IWebBrowser2 browser;

        HashSet<string> seenPages = new HashSet<string>();

        #region
		private string GetResourceContent()
		{
            WebClient myWebClient = new WebClient();
            return myWebClient.DownloadString("http://localhost:7778/res");		
		}

		private void InjectScriptToHead(HTMLDocument doc, string script)
		{

			IHTMLDOMNode head = (IHTMLDOMNode)doc.getElementsByTagName("head").item(0);
			IHTMLScriptElement scriptEl = (IHTMLScriptElement)doc.createElement("script");
			scriptEl.type = "text/javascript";
			scriptEl.text = script;
			head.appendChild((IHTMLDOMNode)scriptEl);
		}

        public bool IsSupportedURL(string url) 
        {
            if (url.StartsWith("about:") ||                 // ignore misc windows which don't need to be recorded
                url == "" ||
                url.StartsWith("javascript:") ||
                url.StartsWith("http://googleads.") ||      // ignore google ads frames just for better perfomance since users wouldn't want to record them anyway
                url.StartsWith("https://googleads."))       
                return false;

            return true;
        }

        public void OnDownloadBegin()
        {
            if (!IsSupportedURL(browser.LocationURL))
                return;

            HTMLDocument doc = browser.Document as HTMLDocument;
            if (doc.readyState == "loading")
            {
                // if the page has been seen already and tries to load again -
                // the window was refreshed and we'll need to inject all the scripts again
                seenPages.Remove(browser.LocationURL);
            }
        }

        public void OnDownloadComplete()
        {
            if (!IsSupportedURL(browser.LocationURL))
                return;

            HTMLDocument doc = browser.Document as HTMLDocument;

            if (doc.readyState == "loading")
            {
                seenPages.Remove(browser.LocationURL);
            }
            else if (doc.readyState == "interactive")
            {
                if (seenPages.Contains(browser.LocationURL))
                    return;

                try
                {
                    var script = GetResourceContent();
                    InjectScriptToHead(doc, script);
                    seenPages.Add(doc.url);
                }
                catch (Exception)
                { // suppress exceptions
                }
            }
        }

        public void OnDocumentComplete(object pDisp, ref object URL) {
            var browser = pDisp as IWebBrowser2;
            if (browser == null)
                return;

            if (!IsSupportedURL(browser.LocationURL))
                return;

            if (seenPages.Contains(browser.LocationURL))
                return;

            HTMLDocument doc = (HTMLDocument)browser.Document;
            try
            {
                var script = GetResourceContent();
                InjectScriptToHead(doc, script);
                seenPages.Add(doc.url);
            }
            catch (Exception)
            { // suppress exceptions
            }
        }
        #endregion

        #region Implementation of IObjectWithSite
        int IObjectWithSite.SetSite(object site)
        {
            if (site != null)
            {
                browser = (IWebBrowser2)site;
                ((DWebBrowserEvents2_Event)browser).DocumentComplete += new DWebBrowserEvents2_DocumentCompleteEventHandler(this.OnDocumentComplete);
                ((DWebBrowserEvents2_Event)browser).DownloadBegin += new DWebBrowserEvents2_DownloadBeginEventHandler(this.OnDownloadBegin);
                ((DWebBrowserEvents2_Event)browser).DownloadComplete += new DWebBrowserEvents2_DownloadCompleteEventHandler(this.OnDownloadComplete);
            }
            else
            {
                ((DWebBrowserEvents2_Event)browser).DocumentComplete -= new DWebBrowserEvents2_DocumentCompleteEventHandler(this.OnDocumentComplete);
                ((DWebBrowserEvents2_Event)browser).DownloadComplete -= new DWebBrowserEvents2_DownloadCompleteEventHandler(this.OnDownloadComplete);
                browser = null;
            }
            return 0;
        }

        int IObjectWithSite.GetSite(ref Guid guid, out IntPtr ppvSite)
        {
            IntPtr punk = Marshal.GetIUnknownForObject(browser);
            int hr = Marshal.QueryInterface(punk, ref guid, out ppvSite);
            Marshal.Release(punk);
            return hr;
        }
        #endregion
        #region Implementation of IOleCommandTarget
        int IOleCommandTarget.QueryStatus(IntPtr pguidCmdGroup, uint cCmds, ref OLECMD prgCmds, IntPtr pCmdText)
        {
            return 0;
        }

        int IOleCommandTarget.Exec(IntPtr pguidCmdGroup, uint nCmdID, uint nCmdexecopt, IntPtr pvaIn, IntPtr pvaOut)
        {
            return 0;
        }
        #endregion

        #region Register/Unregister
        public static string RegBHO = "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Browser Helper Objects";

        [ComRegisterFunction]
        public static void RegisterBHO(Type type)
        {
            string guid = type.GUID.ToString("B");
            RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(RegBHO, true);
            if (registryKey == null)
                registryKey = Registry.LocalMachine.CreateSubKey(RegBHO);
            RegistryKey key = registryKey.OpenSubKey(guid);
            if (key == null)
                key = registryKey.CreateSubKey(guid);
            key.SetValue("", "CloudBeatRecorder");
            key.SetValue("NoExplorer", 1);
            registryKey.Close();
            key.Close();

            // name to display in the addons management screen
            using (key = Registry.ClassesRoot.CreateSubKey("CLSID\\" + type.GUID.ToString("B")))
            {
                key.SetValue(string.Empty, "CloudBeat Recorder");
            }
        }

        [ComUnregisterFunction]
        public static void UnregisterBHO(Type type)
        {
            string guid = type.GUID.ToString("B");
            RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(RegBHO, true);
            if (registryKey != null)
                registryKey.DeleteSubKey(guid, false);
        }
        #endregion
	}
}
