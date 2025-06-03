import React, { useState, useEffect } from 'react';
import './App.css';

// 公司卡片組件
const CompanyCard = ({ company, index }) => {
  const [showIntro, setShowIntro] = useState(false);

  const toggleIntro = () => {
    setShowIntro(!showIntro);
  };

  return (
    <div className={`company-card ${company.isAnalyzed ? 'analyzed' : ''}`}>
      {company.isAnalyzed && <div className="analyzed-badge">AI 已分析</div>}
      
      <h3>{company.公司名稱 || company.標題 || `公司 ${index + 1}`}</h3>
      
      {/* AI 分析結果 */}
      {company.isAnalyzed && company.aiAnalysis && (
        <div className="ai-analysis-section">
          {company.募資輪次 && (
            <>
              <h4>募資輪次</h4>
              <p className="highlight-value">{company.募資輪次}</p>
            </>
          )}
          
          {company.募資金額 && (
            <>
              <h4>募資金額</h4>
              <p className="highlight-value">{company.募資金額}</p>
            </>
          )}
          
          {company.產業別 && (
            <>
              <h4>產業別</h4>
              <p className="highlight-value">{company.產業別}</p>
            </>
          )}
          
          {company.AI公司介紹 && (
            <>
              <h4>AI 公司介紹</h4>
              <p>{company.AI公司介紹}</p>
            </>
          )}
        </div>
      )}
      
      {/* 原始爬取資料 */}
      {company.獲投資訊 && (
        <>
          <h4>獲投資訊</h4>
          <p>{company.獲投資訊}</p>
        </>
      )}
      
      {company.公司與產品簡介 && (
        <div className="company-intro-container">
          <div className="intro-header" onClick={toggleIntro}>
            <h4 style={{ display: 'inline', marginRight: '0.5rem' }}>公司與產品簡介</h4>
            <button className="toggle-intro-btn">
              {showIntro ? '收起' : '展開'}
            </button>
          </div>
          <div className={`company-intro ${showIntro ? 'expanded' : ''}`}>
            <p>{company.公司與產品簡介}</p>
          </div>
        </div>
      )}
      
      {company.官網與相關報導 && (
        <>
          <h4>官網與相關報導</h4>
          <p>{company.官網與相關報導}</p>
        </>
      )}
      
      {/* 分析錯誤訊息 */}
      {company.analysisError && (
        <div className="error message">
          <strong>AI 分析失敗：</strong> {company.analysisError}
        </div>
      )}
    </div>
  );
};

function App() {
  // 狀態管理
  const [activeTab, setActiveTab] = useState('scrape');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [globalApiKey, setGlobalApiKey] = useState('');

  // FindIt 爬蟲狀態
  const [urls, setUrls] = useState(['']);
  const [scrapResults, setScrapResults] = useState([]);
  const [blockedUrls, setBlockedUrls] = useState([]);
  const [useProxy, setUseProxy] = useState(true); // 默認使用代理伺服器
  const [proxyUrl, setProxyUrl] = useState('');

  // Gemini 分析狀態
  const [geminiUrl, setGeminiUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiInstructions, setGeminiInstructions] = useState('分析這個網頁並提取關於公司的重要資訊，包括公司名稱、產品與服務、獲投資訊等');
  const [geminiResult, setGeminiResult] = useState(null);
  const [geminiUseProxy, setGeminiUseProxy] = useState(false);
  const [geminiProxyUrl, setGeminiProxyUrl] = useState('');

  // Excel 比對狀態
  const [excelFile, setExcelFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [matchResults, setMatchResults] = useState(null);
  const [excelApiKey, setExcelApiKey] = useState('');
  const [columnAnalysis, setColumnAnalysis] = useState(null);
  const [useAiAnalysis, setUseAiAnalysis] = useState(false);
  const [aiApiKey, setAiApiKey] = useState('');
  
  // Deal Scope 手動調整狀態
  const [manualScopeAdjustments, setManualScopeAdjustments] = useState({});
  
  // 原始資料展開狀態
  const [expandedOriginalData, setExpandedOriginalData] = useState({});
  
  // 統一的公司數據管理（合併 FindIt 和 AI 網頁分析結果）
  const [allCompaniesData, setAllCompaniesData] = useState([]);
  
  // 公司列表展開狀態
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  
  // Google Sheets 輸出設定
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [isExportingToSheets, setIsExportingToSheets] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  // 使用 globalApiKey 更新各處使用的 API Key
  useEffect(() => {
    if (globalApiKey) {
      setGeminiApiKey(globalApiKey);
      setExcelApiKey(globalApiKey);
      setAiApiKey(globalApiKey);
    }
  }, [globalApiKey]);
  
  // ========== FindIt 爬蟲相關函數 ==========
  
  // 處理網址輸入
  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  // 新增網址輸入欄位
  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  // 移除網址輸入欄位
  const removeUrlField = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  // 送出爬蟲表單
  const handleScrapSubmit = async (e) => {
    e.preventDefault();
    
    const validUrls = urls.filter(url => url.trim() !== '');
    if (validUrls.length === 0) {
      setMessage({ text: '請至少輸入一個網址', type: 'error' });
      return;
    }

    if (useAiAnalysis && !aiApiKey && !globalApiKey) {
      setMessage({ text: '請輸入 Gemini API Key 以進行 AI 分析', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '正在爬取資料，請稍候...', type: 'info' });
    setScrapResults([]);
    setBlockedUrls([]);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          urls: validUrls,
          use_proxy: useProxy,
          proxy_url: useProxy ? proxyUrl : null,
          api_key: useAiAnalysis ? (aiApiKey || globalApiKey) : null
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setScrapResults(result.data);
        setMessage({ text: result.message, type: result.status === 'partial_success' ? 'warning' : 'success' });
        
        // 添加到統一公司數據管理
        addCompaniesData(result.data, 'findit');
        
        // 處理被封鎖的網址
        if (result.blocked_urls && result.blocked_urls.length > 0) {
          setBlockedUrls(result.blocked_urls);
        }
        
        // 檢查是否完全沒有爬取到資料
        if (result.data.length === 0) {
          setMessage({ 
            text: '沒有爬取到任何資料，可能需要手動分析網頁結構',
            type: 'warning'
          });
        }
        
        console.log('爬取結果:', result.data);
        console.log('調試資訊:', result.debug);
      } else {
        throw new Error(result.detail || '爬取失敗');
      }
    } catch (error) {
      setMessage({ text: '錯誤：' + error.message, type: 'error' });
      console.error('完整錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 手動分析網頁結構
  const analyzePageStructure = async () => {
    if (urls.length === 0 || !urls[0].trim()) {
      setMessage({ text: '請至少輸入一個網址', type: 'error' });
      return;
    }
    
    if (!globalApiKey && !geminiApiKey) {
      setMessage({ text: '請輸入 Gemini API Key 以進行分析', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '正在分析網頁結構，請稍候...', type: 'info' });
    
    try {
      const response = await fetch('/api/analyze-with-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urls[0].trim(),
          api_key: globalApiKey || geminiApiKey,
          use_proxy: useProxy,
          proxy_url: useProxy ? proxyUrl : null,
          instructions: '分析這個網頁並提取公司相關資訊。識別網頁結構，找出可能包含公司名稱、融資輪次、融資金額、產業別等信息的部分。請嚴格按照 companies 陣列格式返回結果。'
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // 處理 AI 分析結果，確保格式正確
        let analysisData = result.analysis;
        let companiesToDisplay = [];
        
        if (analysisData && analysisData.companies && Array.isArray(analysisData.companies)) {
          // 新格式：companies 陣列
          companiesToDisplay = analysisData.companies.map((company, index) => ({
            ...company,
            isStructureAnalyzed: true,
            analysisSource: 'page_structure'
          }));
        } else if (analysisData && analysisData.公司名稱) {
          // 舊格式：單一公司物件
          companiesToDisplay = [{
            ...analysisData,
            isStructureAnalyzed: true,
            analysisSource: 'page_structure'
          }];
        } else {
          // 如果格式不明，嘗試將整個 analysis 當作一間公司
          companiesToDisplay = [{
            公司名稱: '網頁結構分析結果',
            公司與產品簡介: JSON.stringify(analysisData, null, 2),
            獲投資訊: '',
            官網與相關報導: urls[0],
            isStructureAnalyzed: true,
            analysisSource: 'page_structure'
          }];
        }
        
        setScrapResults(companiesToDisplay);
        setMessage({ 
          text: `網頁結構分析完成，找到 ${companiesToDisplay.length} 間公司資訊`, 
          type: 'success' 
        });
        
        // 添加到統一公司數據管理
        addCompaniesData(companiesToDisplay, 'ai_analysis');
      } else {
        throw new Error(result.detail || '分析失敗');
      }
    } catch (error) {
      setMessage({ text: '錯誤：' + error.message, type: 'error' });
      console.error('網頁結構分析錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 處理重試被封鎖的 URL
  const retryBlockedUrls = () => {
    if (blockedUrls.length === 0) return;
    
    // 設置 URL 為被封鎖的 URL
    setUrls([...blockedUrls]);
    
    // 提示用戶
    setMessage({ 
      text: '已載入被封鎖的 URL，建議使用代理伺服器重試', 
      type: 'info' 
    });
  };

  // 批量分析所有爬取的公司
  const batchAnalyzeCompanies = async () => {
    if (!scrapResults || scrapResults.length === 0) {
      setMessage({ type: 'warning', text: '請先進行網頁爬取' });
      return;
    }

    if (!globalApiKey) {
      setMessage({ type: 'warning', text: '請先輸入 Gemini API Key' });
      return;
    }

    setIsAnalyzing(true);
    setMessage({ type: 'info', text: '開始批量分析公司資訊...' });

    try {
      // 使用現有的結果作為基礎，逐步更新
      let currentResults = [...scrapResults];
      
      for (let i = 0; i < currentResults.length; i++) {
        const company = currentResults[i];
        
        // 如果已經分析過，跳過
        if (company.isAnalyzed) {
          continue;
        }
        
        setMessage({ type: 'info', text: `正在分析第 ${i + 1}/${currentResults.length} 間公司: ${company.公司名稱 || '未知公司'}...` });

        try {
          // 準備分析文本
          let analysisText = '';
          if (company.公司名稱) {
            analysisText += `公司名稱: ${company.公司名稱}\n`;
          }
          if (company.獲投資訊) {
            analysisText += `獲投資訊: ${company.獲投資訊}\n`;
          }
          if (company.公司與產品簡介) {
            analysisText += `公司與產品簡介: ${company.公司與產品簡介}\n`;
          }
          if (company.官網與相關報導) {
            analysisText += `官網與相關報導: ${company.官網與相關報導}\n`;
          }

          const response = await fetch('/api/analyze-text-with-gemini', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: analysisText,
              api_key: globalApiKey,
              instructions: "分析這個公司資訊，提取公司名稱、募資輪次、募資金額、產業別和公司介紹"
            }),
          });

          if (response.ok) {
            const result = await response.json();
            // 將 AI 分析結果合併到原始公司資料中
            const analyzedCompany = {
              ...company,
              isAnalyzed: true,
              aiAnalysis: result.analysis,
              // 如果 AI 分析出更準確的公司名稱，使用它
              公司名稱: result.analysis.公司名稱 || company.公司名稱,
              募資輪次: result.analysis.募資輪次,
              募資金額: result.analysis.募資金額,
              產業別: result.analysis.產業別,
              AI公司介紹: result.analysis.公司介紹
            };
            
            // 即時更新當前結果
            currentResults[i] = analyzedCompany;
            setScrapResults([...currentResults]); // 立即更新顯示
            
          } else {
            // 如果分析失敗，保留原始資料並標記錯誤
            currentResults[i] = {
              ...company,
              isAnalyzed: false,
              analysisError: '分析失敗'
            };
            setScrapResults([...currentResults]); // 立即更新顯示
          }
        } catch (error) {
          console.error(`分析第 ${i + 1} 間公司時出錯:`, error);
          currentResults[i] = {
            ...company,
            isAnalyzed: false,
            analysisError: error.message
          };
          setScrapResults([...currentResults]); // 立即更新顯示
        }

        // 添加延遲避免 API 限制
        if (i < currentResults.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const analyzedCount = currentResults.filter(r => r.isAnalyzed).length;
      setMessage({ 
        type: 'success', 
        text: `批量分析完成！成功分析 ${analyzedCount}/${currentResults.length} 間公司` 
      });

    } catch (error) {
      console.error('批量分析錯誤:', error);
      setMessage({ type: 'error', text: `批量分析失敗: ${error.message}` });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ========== Gemini AI 分析相關函數 ==========
  
  // 處理 Gemini 分析表單提交
  const handleGeminiSubmit = async (e) => {
    e.preventDefault();
    
    if (!geminiUrl.trim()) {
      setMessage({ text: '請輸入要分析的網址', type: 'error' });
      return;
    }
    
    if (!geminiApiKey.trim()) {
      setMessage({ text: '請輸入 Gemini API Key', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '正在使用 AI 分析網頁，請稍候...', type: 'info' });
    setGeminiResult(null);
    
    try {
      const response = await fetch('/api/analyze-with-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: geminiUrl,
          api_key: geminiApiKey,
          instructions: geminiInstructions,
          use_proxy: geminiUseProxy,
          proxy_url: geminiUseProxy ? geminiProxyUrl : null
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setGeminiResult(result);
        setMessage({ type: 'success', text: result.message || 'AI 分析完成！' });
        
        // 添加到統一公司數據管理
        if (result.analysis && result.analysis.companies && Array.isArray(result.analysis.companies)) {
          addCompaniesData(result.analysis.companies, 'ai_analysis');
        } else if (result.analysis && result.analysis.公司名稱) {
          addCompaniesData([result.analysis], 'ai_analysis');
        }
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.detail || '分析失敗' });
      }
    } catch (error) {
      setMessage({ text: '錯誤：' + error.message, type: 'error' });
      console.error('完整錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== Excel 上傳與比對相關函數 ==========
  
  // 處理 Excel 檔案上傳
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 檢查文件類型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setMessage({ text: '只支持 Excel (.xlsx, .xls) 或 CSV 文件', type: 'error' });
      return;
    }
    
    setExcelFile(file);
    setFileInfo(null);
    setColumnAnalysis(null);
    setSelectedColumn('');
    setMatchResults(null);
    
    // 上傳檔案並獲取基本資訊
    setIsLoading(true);
    setMessage({ text: '分析檔案結構中...', type: 'info' });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setFileInfo(result);
        setMessage({ text: '檔案上傳成功', type: 'success' });
        console.log('檔案資訊:', result);
      } else {
        throw new Error(result.detail || '檔案上傳失敗');
      }
    } catch (error) {
      setMessage({ text: '錯誤：' + error.message, type: 'error' });
      console.error('完整錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 使用 AI 分析 Excel 檔案
  const analyzeExcelWithAI = async () => {
    if (!excelFile) {
      setMessage({ text: '請先上傳 Excel 檔案', type: 'error' });
      return;
    }
    
    if (!excelApiKey.trim()) {
      setMessage({ text: '請輸入 Gemini API Key', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '正在使用 AI 分析檔案結構，請稍候...', type: 'info' });
    
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('api_key', excelApiKey);
      
      const response = await fetch('/api/analyze-excel-with-ai', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setColumnAnalysis(result);
        
        // 自動選擇推薦的欄位
        if (result.ai_analysis && result.ai_analysis.chinese_name_column) {
          setSelectedColumn(result.ai_analysis.chinese_name_column);
        } else if (result.heuristic_analysis && result.heuristic_analysis.chinese_name.length > 0) {
          setSelectedColumn(result.heuristic_analysis.chinese_name[0]);
        }
        
        setMessage({ text: 'AI 分析完成', type: 'success' });
        console.log('AI 分析結果:', result);
      } else {
        throw new Error(result.detail || 'AI 分析失敗');
      }
    } catch (error) {
      setMessage({ text: '錯誤：' + error.message, type: 'error' });
      console.error('完整錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 比對公司名稱
  const matchCompanies = async () => {
    if (!excelFile) {
      setMessage({ text: '請先上傳 Excel 檔案', type: 'error' });
      return;
    }
    
    if (!selectedColumn) {
      setMessage({ text: '請選擇公司名稱欄位', type: 'error' });
      return;
    }
    
    if (!allCompaniesData || allCompaniesData.length === 0) {
      setMessage({ text: '請先爬取公司資料以進行比對（可使用 FindIt 爬取或 AI 網頁分析）', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '比對公司名稱中...', type: 'info' });
    
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('column_name', selectedColumn);
      formData.append('scrape_results', JSON.stringify(allCompaniesData)); // 使用統一的公司數據
      
      // 如果有全域 API Key，添加到請求中進行基石 Deal Scope 分析
      if (globalApiKey) {
        formData.append('api_key', globalApiKey);
      }
      
      const response = await fetch('/api/match-companies', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMatchResults(result);
        let message = '比對完成';
        if (result.cornerstone_analysis && !result.cornerstone_analysis.error) {
          message += `，已完成基石 Deal Scope 分析`;
        }
        setMessage({ text: message, type: 'success' });
        console.log('比對結果:', result);
      } else {
        throw new Error(result.detail || '比對失敗');
      }
    } catch (error) {
      setMessage({ text: '錯誤：' + error.message, type: 'error' });
      console.error('完整錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== 渲染函數 ==========

  // 渲染 Gemini 分析結果
  const renderGeminiResult = () => {
    if (!geminiResult) return null;

  return (
      <div className="results-section">
        <h2>AI 分析結果</h2>
        
        {/* 顯示分析的網址 */}
        <div className="info message">
          <strong>分析網址：</strong> {geminiResult.url}
        </div>

        {/* 顯示公司資訊 */}
        {geminiResult.analysis && geminiResult.analysis.companies && geminiResult.analysis.companies.length > 0 ? (
          <div className="results-grid">
            {geminiResult.analysis.companies.map((company, index) => (
              <div key={index} className="company-card analyzed">
                <div className="analyzed-badge">AI 分析</div>
                <h3>{company.公司名稱 || `公司 ${index + 1}`}</h3>
                
                {company.獲投資訊 && (
                  <>
                    <h4>獲投資訊</h4>
                    <p>{company.獲投資訊}</p>
                  </>
                )}
                
                {company.公司與產品簡介 && (
                  <>
                    <h4>公司與產品簡介</h4>
                    <p>{company.公司與產品簡介}</p>
                  </>
                )}
                
                {company.創辦人 && (
                  <>
                    <h4>創辦人</h4>
                    <p>{company.創辦人}</p>
                  </>
                )}
                
                {company.官網與相關報導 && (
                  <>
                    <h4>官網與相關報導</h4>
                    <p>{company.官網與相關報導}</p>
                  </>
                )}
                
                {company.其他重要資訊 && (
                  <>
                    <h4>其他重要資訊</h4>
                    <p>{company.其他重要資訊}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="warning message">
            未能從網頁中提取到結構化的公司資訊。
            {geminiResult.analysis && geminiResult.analysis.原始分析結果 && (
              <div className="raw-analysis">
                <h4>原始分析結果：</h4>
                <pre>{geminiResult.analysis.原始分析結果}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // 渲染 Excel 欄位選擇
  const renderColumnSelection = () => {
    if (!fileInfo) return null;
    
    return (
      <div className="column-selector">
        <h3>選擇公司名稱欄位</h3>
        
        {columnAnalysis?.ai_analysis && (
          <div className="ai-suggestions">
            <p className="suggestion-label">AI 推薦欄位：</p>
            {columnAnalysis.ai_analysis.chinese_name_column && (
              <button 
                className={`suggestion-btn ${selectedColumn === columnAnalysis.ai_analysis.chinese_name_column ? 'active' : ''}`}
                onClick={() => setSelectedColumn(columnAnalysis.ai_analysis.chinese_name_column)}
              >
                {columnAnalysis.ai_analysis.chinese_name_column} (推薦)
              </button>
            )}
          </div>
        )}
        
        <div className="column-options">
          <label>從所有欄位中選擇：</label>
          <select 
            className="column-select" 
            value={selectedColumn} 
            onChange={(e) => setSelectedColumn(e.target.value)}
          >
            <option value="">-- 選擇欄位 --</option>
            {fileInfo.columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        
        {fileInfo.sample_data && selectedColumn && (
          <div className="sample-data">
            <h4>樣本數據 ({selectedColumn}):</h4>
            <ul className="sample-list">
              {fileInfo.sample_data[selectedColumn].slice(0, 5).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  // 渲染比對結果
  const renderMatchResults = () => {
    if (!matchResults) return null;
    
    return (
      <div className="match-results">
        <div className="match-summary">
          <h3>比對結果摘要</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-number">{matchResults.matched_count}</div>
              <div className="stat-label">已匹配</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{matchResults.unmatched_count}</div>
              <div className="stat-label">未匹配</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{matchResults.match_rate}%</div>
              <div className="stat-label">匹配率</div>
            </div>
          </div>
        </div>
        
        {/* 基石 Deal Scope 分析結果 */}
        {renderCornerstoneAnalysis()}
        
        {/* 調試信息 */}
        <div className="debug-section">
          <div className="detail-row debug-header" onClick={() => {
            const element = document.querySelector('.debug-content');
            if (element) {
              element.classList.toggle('expanded');
              
              // 切换按钮文字
              const button = document.querySelector('.toggle-debug-btn');
              if (button) {
                if (element.classList.contains('expanded')) {
                  button.textContent = '隱藏調試信息 ▲';
                } else {
                  button.textContent = '顯示調試信息 ▼';
                }
              }
            }
          }}>
            <span className="detail-label">調試信息:</span>
            <button className="toggle-debug-btn">顯示調試信息 ▼</button>
          </div>
          <div className="debug-content">
            <div className="debug-item">
              <h4>爬取的公司總數: {matchResults.total_scraped}</h4>
              <h4>Excel 公司總數: {matchResults.total_excel}</h4>
            </div>
            
            {/* 原始資料與提取資料比較 */}
            {matchResults.original_companies && matchResults.extracted_companies && (
              <div className="debug-item">
                <h4>公司名稱提取過程 (最多10個):</h4>
                <div className="debug-table">
                  <div className="debug-table-header">
                    <div className="debug-cell">原始標題/名稱</div>
                    <div className="debug-cell">提取後的公司名稱</div>
                    <div className="debug-cell">清理後的公司名稱</div>
                  </div>
                  {matchResults.debug_info?.原始名稱?.map((name, idx) => (
                    <div className="debug-table-row" key={idx}>
                      <div className="debug-cell">{name}</div>
                      <div className="debug-cell">{matchResults.debug_info?.提取後名稱[idx] || "無法提取"}</div>
                      <div className="debug-cell">{matchResults.debug_info?.清理後名稱[idx] || "無法清理"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Excel 資料清理過程 */}
            {matchResults.excel_sample && matchResults.debug_info?.Excel清理後名稱 && (
              <div className="debug-item">
                <h4>Excel 公司名稱清理過程 (最多10個):</h4>
                <div className="debug-table">
                  <div className="debug-table-header">
                    <div className="debug-cell">Excel 原始名稱</div>
                    <div className="debug-cell">清理後的名稱</div>
                  </div>
                  {matchResults.debug_info?.Excel原始名稱?.map((name, idx) => (
                    <div className="debug-table-row" key={idx}>
                      <div className="debug-cell">{name}</div>
                      <div className="debug-cell">{matchResults.debug_info?.Excel清理後名稱[idx] || "無法清理"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 匹配詳情 */}
            {matchResults.match_details && matchResults.match_details.length > 0 && (
              <div className="debug-item">
                <h4>匹配成功的例子 (最多20個):</h4>
                <div className="debug-table">
                  <div className="debug-table-header">
                    <div className="debug-cell">爬取的公司名稱</div>
                    <div className="debug-cell">匹配的Excel公司名稱</div>
                  </div>
                  {matchResults.match_details.map((match, idx) => (
                    <div className="debug-table-row" key={idx}>
                      <div className="debug-cell">{match.scraped}</div>
                      <div className="debug-cell">{match.excel}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="match-details">
          <div className="match-section">
            <h4>已匹配公司 ({matchResults.matched_count})</h4>
            <div className="companies-grid">
              {matchResults.matched_companies.slice(0, 50).map((companyName, idx) => {
                // 從原始爬取結果中找到對應的公司詳細資料
                const companyDetail = scrapResults.find(company => 
                  company.公司名稱 === companyName || 
                  (company.標題 && company.標題.includes(companyName)) ||
                  (company['Full name (Chinese)'] === companyName)
                );
                
                return (
                  <div key={idx} className="company-analysis-card matched">
                    <h5>{companyName}</h5>
                    {companyDetail && companyDetail.isAnalyzed && (
                      <div className="analysis-details">
                        <div className="analyzed-badge">已 AI 分析</div>
                        {companyDetail.募資輪次 && (
                          <div className="detail-row">
                            <span className="detail-label">募資輪次:</span>
                            <span className="detail-value highlight-value">{companyDetail.募資輪次}</span>
                          </div>
                        )}
                        {companyDetail.募資金額 && (
                          <div className="detail-row">
                            <span className="detail-label">募資金額:</span>
                            <span className="detail-value highlight-value">{companyDetail.募資金額}</span>
                          </div>
                        )}
                        {companyDetail.產業別 && (
                          <div className="detail-row">
                            <span className="detail-label">產業別:</span>
                            <span className="detail-value highlight-value">{companyDetail.產業別}</span>
                          </div>
                        )}
                        {companyDetail.AI公司介紹 && (
                          <div className="detail-row">
                            <span className="detail-label">公司介紹:</span>
                            <span className="detail-value">{companyDetail.AI公司介紹}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {companyDetail && !companyDetail.isAnalyzed && (
                      <div className="analysis-details">
                        <div className="info message">尚未進行 AI 分析</div>
                      </div>
                    )}
                    {!companyDetail && (
                      <div className="analysis-details">
                        <div className="warning message">找不到詳細資料</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {matchResults.matched_count > 50 && (
              <p className="more-note">還有 {matchResults.matched_count - 50} 家公司未顯示</p>
            )}
          </div>
          
          <div className="match-section">
            <h4>未匹配公司 ({matchResults.unmatched_count})</h4>
            <div className="companies-grid">
              {matchResults.unmatched_companies.slice(0, 50).map((companyName, idx) => {
                // 從原始爬取結果中找到對應的公司詳細資料
                const companyDetail = scrapResults.find(company => 
                  company.公司名稱 === companyName || 
                  (company.標題 && company.標題.includes(companyName)) ||
                  (company['Full name (Chinese)'] === companyName)
                );
                
                return (
                  <div key={idx} className="company-analysis-card unmatched">
                    <h5>{companyName}</h5>
                    {companyDetail && companyDetail.isAnalyzed && (
                      <div className="analysis-details">
                        <div className="analyzed-badge">已 AI 分析</div>
                        {companyDetail.募資輪次 && (
                          <div className="detail-row">
                            <span className="detail-label">募資輪次:</span>
                            <span className="detail-value highlight-value">{companyDetail.募資輪次}</span>
                          </div>
                        )}
                        {companyDetail.募資金額 && (
                          <div className="detail-row">
                            <span className="detail-label">募資金額:</span>
                            <span className="detail-value highlight-value">{companyDetail.募資金額}</span>
                          </div>
                        )}
                        {companyDetail.產業別 && (
                          <div className="detail-row">
                            <span className="detail-label">產業別:</span>
                            <span className="detail-value highlight-value">{companyDetail.產業別}</span>
                          </div>
                        )}
                        {companyDetail.AI公司介紹 && (
                          <div className="detail-row">
                            <span className="detail-label">公司介紹:</span>
                            <span className="detail-value">{companyDetail.AI公司介紹}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {companyDetail && !companyDetail.isAnalyzed && (
                      <div className="analysis-details">
                        <div className="info message">尚未進行 AI 分析</div>
                      </div>
                    )}
                    {!companyDetail && (
                      <div className="analysis-details">
                        <div className="warning message">找不到詳細資料</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {matchResults.unmatched_count > 50 && (
              <p className="more-note">還有 {matchResults.unmatched_count - 50} 家公司未顯示</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染基石 Deal Scope 分析結果
  const renderCornerstoneAnalysis = () => {
    const analysis = matchResults.cornerstone_analysis;
    
    console.log('🔍 基石分析數據:', analysis);
    console.log('🔍 matchResults 完整數據:', matchResults);
    
    // 如果沒有基石分析數據，顯示說明
    if (!analysis) {
      return (
        <div className="cornerstone-analysis">
          <h3>基石 Deal Scope 分析</h3>
          <div className="info message">
            <p>📝 基石 Deal Scope 分析需要以下條件：</p>
            <ul>
              <li>✅ 已完成公司比對</li>
              <li>❓ 需要提供 Google AI Studio API Key</li>
              <li>❓ 需要有未匹配的公司進行分析</li>
            </ul>
            <p>💡 請確保在全域設定中輸入 API Key，然後重新進行比對。</p>
          </div>
        </div>
      );
    }
    
    if (analysis.error) {
      return (
        <div className="cornerstone-analysis">
          <h3>基石 Deal Scope 分析</h3>
          <div className="error message">
            {analysis.error}
            {analysis.wait_time && (
              <p>建議等待 {analysis.wait_time} 秒後重試</p>
            )}
          </div>
        </div>
      );
    }
    
    // 合併所有公司並應用手動調整
    const allCompanies = [
      ...(analysis.in_scope_companies || []),
      ...(analysis.out_of_scope_companies || [])
    ];
    
    console.log('🔍 所有公司數據:', allCompanies);
    console.log('🔍 符合範圍公司:', analysis.in_scope_companies);
    console.log('🔍 不符合範圍公司:', analysis.out_of_scope_companies);
    
    // 如果沒有分析到任何公司
    if (allCompanies.length === 0) {
      return (
        <div className="cornerstone-analysis">
          <h3>基石 Deal Scope 分析</h3>
          <div className="warning message">
            <p>🤔 沒有找到需要分析的公司數據</p>
            <p>可能的原因：</p>
            <ul>
              <li>所有公司都已在 Excel 中匹配到</li>
              <li>未匹配的公司無法找到對應的爬取數據</li>
              <li>API 分析過程中出現錯誤</li>
            </ul>
            <p>分析詳情：總分析 {analysis.total_analyzed || 0} 家公司</p>
          </div>
        </div>
      );
    }
    
    // 按照最終狀態分類公司
    const finalInScopeCompanies = allCompanies.filter(company => getFinalScopeStatus(company));
    const finalOutOfScopeCompanies = allCompanies.filter(company => !getFinalScopeStatus(company));
    
    console.log('🔍 最終符合範圍公司:', finalInScopeCompanies);
    console.log('🔍 最終不符合範圍公司:', finalOutOfScopeCompanies);
    
    return (
      <div className="cornerstone-analysis">
        <div className="analysis-header">
          <h3>基石 Deal Scope 分析</h3>
          <div className="scope-controls">
            <button 
              className="reset-btn"
              onClick={resetScopeAdjustments}
              disabled={Object.keys(manualScopeAdjustments).length === 0}
            >
              重置調整
            </button>
          </div>
        </div>
        
        {/* 分析摘要 */}
        <div className="analysis-summary">
          <div className="stats-grid">
            <div className="stat-box in-scope">
              <div className="stat-number">{finalInScopeCompanies.length}</div>
              <div className="stat-label">符合基石範圍</div>
            </div>
            <div className="stat-box out-of-scope">
              <div className="stat-number">{finalOutOfScopeCompanies.length}</div>
              <div className="stat-label">不符合基石範圍</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{allCompanies.length}</div>
              <div className="stat-label">總分析公司</div>
            </div>
          </div>
        </div>
        
        {/* 說明 */}
        <div className="scope-explanation">
          <p>📢 <strong>基石投資標準：</strong>A 輪及之前的輪次（天使、種子、Pre-A、A輪），B輪及以後不投資</p>
          <p>💡 <strong>手動調整：</strong>點擊公司卡片右上角的切換按鈕可以手動調整分類</p>
        </div>
        
        {/* 符合基石範圍的公司 */}
        <div className="scope-section in-scope-section">
          <h4>✅ 符合基石投資範圍的公司 ({finalInScopeCompanies.length})</h4>
          <div className="companies-grid">
            {finalInScopeCompanies.map((company, idx) => {
              const isManuallyAdjusted = manualScopeAdjustments.hasOwnProperty(company.company_name);
              const originalScope = company.in_scope;
              
              return (
                <div key={idx} className={`company-scope-card in-scope ${isManuallyAdjusted ? 'manually-adjusted' : ''}`}>
                  <div className="card-header">
                    <h5>{company.company_name}</h5>
                    <button 
                      className="scope-toggle-btn out-scope"
                      onClick={() => toggleCompanyScope(company.company_name, true)}
                      title="移到不符合範圍"
                    >
                      ❌
                    </button>
                  </div>
                  
                  {isManuallyAdjusted && (
                    <div className="adjustment-badge">
                      手動調整 {originalScope ? '(原本符合)' : '(原本不符合)'}
                    </div>
                  )}
                  
                  <div className="company-details">
                    <div className="detail-row">
                      <span className="detail-label">AI 分析輪次:</span>
                      <span className="detail-value">{company.ai_funding_round}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">輪次分類:</span>
                      <span className={`detail-value ${company.funding_classification === '基石關注輪次' ? 'highlight-green' : 'highlight-red'}`}>
                        {company.funding_classification}
                      </span>
                    </div>
                    {company.funding_amount && (
                      <div className="detail-row">
                        <span className="detail-label">募資金額:</span>
                        <span className="detail-value">{company.funding_amount}</span>
                      </div>
                    )}
                    {company.description && (
                      <div className="detail-row description">
                        <span className="detail-label">公司描述:</span>
                        <span className="detail-value">{company.description}</span>
                      </div>
                    )}
                    
                    {/* 原始資料展開/收起 */}
                    {company.original_data && Object.keys(company.original_data).some(key => company.original_data[key]) && (
                      <div className="original-data-section">
                        <div 
                          className="original-data-header" 
                          onClick={() => toggleOriginalData(company.company_name)}
                          style={{ cursor: 'pointer', marginTop: '0.5rem' }}
                        >
                          <span className="detail-label">原始資料:</span>
                          <button className="toggle-original-data-btn">
                            {expandedOriginalData[company.company_name] ? '收起 ▲' : '展開 ▼'}
                          </button>
                        </div>
                        {expandedOriginalData[company.company_name] && (
                          <div className="original-data-content">
                            {Object.entries(company.original_data).map(([key, value]) => 
                              value && (
                                <div key={key} className="detail-row">
                                  <span className="detail-label">{key}:</span>
                                  <span className="detail-value">{value}</span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 不符合基石範圍的公司 */}
        <div className="scope-section out-of-scope-section">
          <h4>❌ 不符合基石投資範圍的公司 ({finalOutOfScopeCompanies.length})</h4>
          <div className="companies-grid">
            {finalOutOfScopeCompanies.map((company, idx) => {
              const isManuallyAdjusted = manualScopeAdjustments.hasOwnProperty(company.company_name);
              const originalScope = company.in_scope;
              
              return (
                <div key={idx} className={`company-scope-card out-of-scope ${isManuallyAdjusted ? 'manually-adjusted' : ''}`}>
                  <div className="card-header">
                    <h5>{company.company_name}</h5>
                    <button 
                      className="scope-toggle-btn in-scope"
                      onClick={() => toggleCompanyScope(company.company_name, false)}
                      title="移到符合範圍"
                    >
                      ✅
                    </button>
                  </div>
                  
                  {isManuallyAdjusted && (
                    <div className="adjustment-badge">
                      手動調整 {originalScope ? '(原本符合)' : '(原本不符合)'}
                    </div>
                  )}
                  
                  <div className="company-details">
                    <div className="detail-row">
                      <span className="detail-label">AI 分析輪次:</span>
                      <span className="detail-value">{company.ai_funding_round}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">輪次分類:</span>
                      <span className={`detail-value ${company.funding_classification === '基石關注輪次' ? 'highlight-green' : 'highlight-red'}`}>
                        {company.funding_classification}
                      </span>
                    </div>
                    {company.funding_amount && (
                      <div className="detail-row">
                        <span className="detail-label">募資金額:</span>
                        <span className="detail-value">{company.funding_amount}</span>
                      </div>
                    )}
                    {company.description && (
                      <div className="detail-row description">
                        <span className="detail-label">公司描述:</span>
                        <span className="detail-value">{company.description}</span>
                      </div>
                    )}
                    <div className="scope-reason">
                      <small>
                        不符合原因: {company.funding_classification !== '基石關注輪次' ? '輪次太晚（B輪以後）' : '其他原因'}
                      </small>
                    </div>
                    
                    {/* 原始資料展開/收起 */}
                    {company.original_data && Object.keys(company.original_data).some(key => company.original_data[key]) && (
                      <div className="original-data-section">
                        <div 
                          className="original-data-header" 
                          onClick={() => toggleOriginalData(company.company_name)}
                          style={{ cursor: 'pointer', marginTop: '0.5rem' }}
                        >
                          <span className="detail-label">原始資料:</span>
                          <button className="toggle-original-data-btn">
                            {expandedOriginalData[company.company_name] ? '收起 ▲' : '展開 ▼'}
                          </button>
                        </div>
                        {expandedOriginalData[company.company_name] && (
                          <div className="original-data-content">
                            {Object.entries(company.original_data).map(([key, value]) => 
                              value && (
                                <div key={key} className="detail-row">
                                  <span className="detail-label">{key}:</span>
                                  <span className="detail-value">{value}</span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ========== Deal Scope 手動調整函數 ==========
  
  // 切換公司的 Deal Scope 狀態
  const toggleCompanyScope = (companyName, currentScope) => {
    setManualScopeAdjustments(prev => ({
      ...prev,
      [companyName]: !currentScope
    }));
  };
  
  // 獲取公司的最終 Deal Scope 狀態（考慮手動調整）
  const getFinalScopeStatus = (company) => {
    const companyName = company.company_name;
    if (manualScopeAdjustments.hasOwnProperty(companyName)) {
      return manualScopeAdjustments[companyName];
    }
    // 如果沒有手動調整，使用原始分析結果
    return company.in_scope || false;
  };
  
  // 重置所有手動調整
  const resetScopeAdjustments = () => {
    setManualScopeAdjustments({});
  };
  
  // 切換原始資料展開狀態
  const toggleOriginalData = (companyName) => {
    setExpandedOriginalData(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  // ========== 統一公司數據管理函數 ==========
  
  // 添加公司數據到統一管理
  const addCompaniesData = (companies, source = 'unknown') => {
    const companiesWithSource = companies.map(company => ({
      ...company,
      dataSource: source,
      id: `${source}_${company.公司名稱 || company.標題 || Math.random()}`
    }));
    
    setAllCompaniesData(prev => {
      // 移除來自同一來源的舊數據
      const filteredPrev = prev.filter(c => c.dataSource !== source);
      return [...filteredPrev, ...companiesWithSource];
    });
  };
  
  // 清空所有公司數據
  const clearAllCompaniesData = () => {
    setAllCompaniesData([]);
    setScrapResults([]);
    setGeminiResult(null);
    setMatchResults(null);
    setManualScopeAdjustments({});
    setExpandedOriginalData({});
    setExportResult(null);
  };
  
  // 清空特定來源的數據
  const clearDataBySource = (source) => {
    setAllCompaniesData(prev => prev.filter(c => c.dataSource !== source));
    
    if (source === 'findit') {
      setScrapResults([]);
    } else if (source === 'ai_analysis') {
      setGeminiResult(null);
    }
  };
  
  // 獲取所有公司數據的摘要
  const getCompaniesDataSummary = () => {
    const finditCount = allCompaniesData.filter(c => c.dataSource === 'findit').length;
    const aiAnalysisCount = allCompaniesData.filter(c => c.dataSource === 'ai_analysis').length;
    
    return {
      total: allCompaniesData.length,
      findit: finditCount,
      aiAnalysis: aiAnalysisCount
    };
  };
  
  // ========== Google Sheets 輸出功能 ==========
  
  // 輸出到 Google Sheets
  const exportToGoogleSheets = async () => {
    if (!matchResults) {
      setMessage({ text: '請先完成公司比對', type: 'error' });
      return;
    }
    
    if (!googleSheetsUrl) {
      setMessage({ text: '請輸入 Google Sheets URL', type: 'error' });
      return;
    }
    
    setIsExportingToSheets(true);
    setMessage({ text: '正在準備輸出數據...', type: 'info' });
    
    try {
      const exportData = {
        matchResults: matchResults,
        allCompaniesData: allCompaniesData,
        sheetsUrl: googleSheetsUrl
      };
      
      const response = await fetch('/api/export-to-google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ 
          text: '數據已準備完成！請複製下方的 CSV 數據到 Google Sheets', 
          type: 'success' 
        });
        
        // 設置導出結果以供顯示
        setExportResult(result.export_data);
        
        // 打開 Google Sheets
        window.open(googleSheetsUrl, '_blank');
      } else {
        throw new Error(result.detail || '輸出失敗');
      }
    } catch (error) {
      setMessage({ text: '錯誤：' + error.message, type: 'error' });
      console.error('Google Sheets 輸出錯誤:', error);
    } finally {
      setIsExportingToSheets(false);
    }
  };

  return (
    <div className="main">
      {/* 頂部導航欄 */}
      <div className="header-container">
        <div className="logo-section">
          <img src="/logo.png" alt="CSVC Logo" className="logo" />
          <div className="brand-text">基石內部 | 網頁資料爬取與分析工具</div>
        </div>
        <div className="global-api-container">
          <input
            type="password"
            placeholder="輸入全域 API Key"
            value={globalApiKey}
            onChange={(e) => setGlobalApiKey(e.target.value)}
            className="global-api-input"
          />
          <div className="api-tooltip">
            <span>可以在 </span>
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>
            <span> 獲取 API Key</span>
          </div>
        </div>
      </div>

      {/* 消息顯示區域 */}
      {message.text && (
        <div className={`message ${message.type}`}>
          <span>{message.text}</span>
          <button 
            className="message-close" 
            onClick={() => setMessage({ text: '', type: '' })}
          >
            ✕
          </button>
        </div>
      )}

      <div className="container">
        {/* 標籤頁 */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'scrape' ? 'active' : ''}`}
            onClick={() => setActiveTab('scrape')}
          >
            FindIt 爬取
          </button>
          <button 
            className={`tab-btn ${activeTab === 'gemini' ? 'active' : ''}`}
            onClick={() => setActiveTab('gemini')}
          >
            AI 網頁分析
          </button>
          <button 
            className={`tab-btn ${activeTab === 'excel' ? 'active' : ''}`}
            onClick={() => setActiveTab('excel')}
          >
            Excel 比對
          </button>
        </div>
        
        {/* FindIt 爬蟲表單 */}
        {activeTab === 'scrape' && (
          <div className="tab-content">
            <form className="form" onSubmit={handleScrapSubmit}>
              {/* 網址輸入區塊 */}
              <div className="form-group">
                <label className="label">FindIt 網址</label>
                {urls.map((url, index) => (
                  <div key={index} className="url-input-group">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      placeholder="請輸入 FindIt 文章網址"
                      className="input url-input"
                    />
                    <button
                      type="button"
                      className="btn remove-btn"
                      onClick={() => removeUrlField(index)}
                      disabled={urls.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn add-btn"
                  onClick={addUrlField}
                >
                  + 新增網址
                </button>
              </div>
              
              {/* 代理伺服器設定 */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                  />
                  使用代理伺服器 (解決封鎖問題)
                </label>
                
                {useProxy && (
                  <input
                    type="text"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    placeholder="代理伺服器網址 (例如: http://proxy.example.com:8080)"
                    className="input proxy-input"
                  />
                )}
              </div>
              
              {/* AI 分析設定 */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useAiAnalysis}
                    onChange={(e) => setUseAiAnalysis(e.target.checked)}
                  />
                  使用 AI 分析
                </label>
              </div>
              
              {useAiAnalysis && (
                <div className="form-group">
                  <label className="label">Gemini API Key</label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="請輸入您的 Gemini API Key"
                    className="input"
                  />
                  <p className="help-text">
                    可以在 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> 獲取 API Key
                  </p>
                </div>
              )}
              
              {/* 提交按鈕 */}
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-animation">
                    <span className="loading-text">爬取中</span>
                    <span className="loading-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                  </span>
                ) : '開始爬取'}
              </button>
            </form>

            {/* 被封鎖的 URL */}
            {blockedUrls.length > 0 && (
              <div className="blocked-section">
                <h2>被封鎖的網址</h2>
                <p className="blocked-info">以下網址被網站的安全機制封鎖，無法爬取:</p>
                <ul className="blocked-list">
                  {blockedUrls.map((url, idx) => (
                    <li key={idx}>{url}</li>
                  ))}
                </ul>
                <button 
                  className="retry-btn"
                  onClick={retryBlockedUrls}
                >
                  重試被封鎖的網址
                </button>
              </div>
            )}

            {/* 顯示爬取結果 */}
            {scrapResults.length > 0 && (
              <div className="results-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>爬取結果 ({scrapResults.length} 家公司)</h2>
                  
                  {/* 操作按鈕組 */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button 
                      onClick={batchAnalyzeCompanies}
                      disabled={isAnalyzing || !globalApiKey}
                      className="analyze-btn"
                    >
                      {isAnalyzing ? (
                        <div className="loading-animation">
                          <span className="loading-text">分析中</span>
                          <div className="loading-dots">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                          </div>
                        </div>
                      ) : (
                        '批量 AI 分析'
                      )}
                    </button>
                    
                    <button onClick={analyzePageStructure} className="analyze-btn">
                      分析頁面結構
                    </button>
                    
                    <button 
                      onClick={() => clearDataBySource('findit')} 
                      className="clear-btn"
                      style={{ backgroundColor: '#dc3545', color: 'white' }}
                    >
                      清空 FindIt 數據
                    </button>
                  </div>
                </div>
                
                <div className="results-grid">
                  {scrapResults.map((item, index) => (
                    <CompanyCard key={index} company={item} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Gemini AI 分析表單 */}
        {activeTab === 'gemini' && (
          <div className="tab-content">
            <form className="form" onSubmit={handleGeminiSubmit}>
              {/* 網址輸入 */}
              <div className="form-group">
                <label className="label">目標網址</label>
                <input
                  type="url"
                  value={geminiUrl}
                  onChange={(e) => setGeminiUrl(e.target.value)}
                  placeholder="請輸入要分析的公司網頁網址"
                  className="input"
                  required
                />
              </div>
              
              {/* API Key 輸入 */}
              <div className="form-group">
                <label className="label">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="請輸入您的 Gemini API Key"
                  className="input"
                  required
                />
                <p className="help-text">
                  可以在 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> 獲取 API Key
                </p>
              </div>
              
              {/* 分析指示輸入 */}
              <div className="form-group">
                <label className="label">分析指示 (可選)</label>
                <textarea
                  value={geminiInstructions}
                  onChange={(e) => setGeminiInstructions(e.target.value)}
                  placeholder="請輸入具體的分析指示，例如：分析這家公司的主要產品和技術..."
                  className="input textarea"
                  rows={3}
                />
              </div>
              
              {/* 代理伺服器設定 */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={geminiUseProxy}
                    onChange={(e) => setGeminiUseProxy(e.target.checked)}
                  />
                  使用代理伺服器 (解決封鎖問題)
                </label>
                
                {geminiUseProxy && (
                  <input
                    type="text"
                    value={geminiProxyUrl}
                    onChange={(e) => setGeminiProxyUrl(e.target.value)}
                    placeholder="代理伺服器網址 (例如: http://proxy.example.com:8080)"
                    className="input proxy-input"
                  />
                )}
              </div>
              
              {/* 提交按鈕 */}
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-animation">
                    <span className="loading-text">分析中</span>
                    <span className="loading-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                  </span>
                ) : '開始分析'}
              </button>
            </form>
            
            {/* 分析結果顯示區域 */}
            {geminiResult && (
              <div className="results-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>AI 分析結果</h2>
                  
                  {/* 操作按鈕組 */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => clearDataBySource('ai_analysis')} 
                      className="clear-btn"
                      style={{ backgroundColor: '#dc3545', color: 'white' }}
                    >
                      清空 AI 分析數據
                    </button>
                  </div>
                </div>
                
                {renderGeminiResult()}
                {renderColumnSelection()}
                {renderMatchResults()}
              </div>
            )}
          </div>
        )}
        
        {/* Excel 上傳與比對表單 */}
        {activeTab === 'excel' && (
          <div className="tab-content">
            
            {/* 所有公司數據概覽 */}
            <div className="companies-overview-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>目前所有公司數據概覽</h3>
                <button 
                  onClick={clearAllCompaniesData}
                  className="clear-btn"
                  style={{ backgroundColor: '#dc3545', color: 'white' }}
                  disabled={allCompaniesData.length === 0}
                >
                  清空所有數據
                </button>
              </div>
              
              {allCompaniesData.length > 0 ? (
                <div className="companies-summary">
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-number">{getCompaniesDataSummary().total}</span>
                      <span className="stat-label">總公司數</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{getCompaniesDataSummary().findit}</span>
                      <span className="stat-label">FindIt 爬取</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{getCompaniesDataSummary().aiAnalysis}</span>
                      <span className="stat-label">AI 網頁分析</span>
                    </div>
                  </div>
                  
                  {/* 公司列表預覽 */}
                  <div className="companies-preview">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4>公司列表預覽</h4>
                      <button 
                        onClick={() => setShowAllCompanies(!showAllCompanies)}
                        className="toggle-companies-btn"
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {showAllCompanies ? '收起列表' : `展開全部 (${allCompaniesData.length} 家)`}
                      </button>
                    </div>
                    <div className="companies-grid-preview">
                      {(showAllCompanies ? allCompaniesData : allCompaniesData.slice(0, 20)).map((company, idx) => (
                        <div key={company.id || idx} className="company-preview-card">
                          <div className="company-name">{company.公司名稱 || company.標題 || `公司 ${idx + 1}`}</div>
                          <div className="company-source">來源: {company.dataSource === 'findit' ? 'FindIt爬取' : 'AI網頁分析'}</div>
                          {company.isAnalyzed && <div className="analyzed-tag">已AI分析</div>}
                        </div>
                      ))}
                    </div>
                    {!showAllCompanies && allCompaniesData.length > 20 && (
                      <p className="more-companies">還有 {allCompaniesData.length - 20} 家公司未顯示，點擊「展開全部」查看</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-companies-message">
                  <p>目前沒有公司數據。請先使用「FindIt 爬取」或「AI 網頁分析」功能獲取公司數據。</p>
                </div>
              )}
            </div>
            
            <div className="file-upload-section">
              <h3>上傳 Excel 或 CSV 文件</h3>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  id="excelFile"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                <label htmlFor="excelFile" className="file-label">
                  選擇檔案
                </label>
                <span className="file-name">
                  {excelFile ? excelFile.name : '未選擇檔案'}
                </span>
              </div>
              
              {fileInfo && (
                <div className="file-info">
                  <p className="file-info-item">檔案名稱: <strong>{fileInfo.file_name}</strong></p>
                  <p className="file-info-item">列數: <strong>{fileInfo.row_count}</strong></p>
                  <p className="file-info-item">欄位數: <strong>{fileInfo.columns.length}</strong></p>
                </div>
              )}
            </div>
            
            {fileInfo && (
              <div className="ai-analysis-section">
                <h3>AI 欄位分析</h3>
                <div className="form-group">
                  <label className="label">Gemini API Key</label>
                  <input
                    type="password"
                    value={excelApiKey}
                    onChange={(e) => setExcelApiKey(e.target.value)}
                    placeholder="請輸入您的 Gemini API Key"
                    className="input"
                  />
                  <p className="help-text">
                    可以在 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> 獲取 API Key
                  </p>
                </div>
                
                <button
                  className="analyze-btn"
                  onClick={analyzeExcelWithAI}
                  disabled={isLoading || !excelFile || !excelApiKey}
                >
                  {isLoading ? '分析中...' : '使用 AI 分析欄位'}
                </button>
              </div>
            )}
            
            {fileInfo && renderColumnSelection()}
            
            {fileInfo && selectedColumn && allCompaniesData && allCompaniesData.length > 0 && (
              <div className="match-section">
                <h3>比對公司數據</h3>
                <div className="match-info">
                  <p>已選擇欄位: <strong>{selectedColumn}</strong></p>
                  <p>可用公司數據: <strong>{allCompaniesData.length} 家公司</strong></p>
                  <p>數據來源: FindIt爬取 {getCompaniesDataSummary().findit} 家，AI網頁分析 {getCompaniesDataSummary().aiAnalysis} 家</p>
                </div>
                
                <button
                  className="match-btn"
                  onClick={matchCompanies}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading-animation">
                      <span className="loading-text">比對中</span>
                      <span className="loading-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </span>
                    </span>
                  ) : '開始比對'}
                </button>
              </div>
            )}
            
            {matchResults && renderMatchResults()}
            
            {/* Google Sheets 輸出功能 */}
            {matchResults && (
              <div className="google-sheets-export">
                <h3>輸出到 Google 試算表</h3>
                <div className="export-form">
                  <div className="form-group">
                    <label className="label">Google Sheets URL (可編輯權限)</label>
                    <input
                      type="url"
                      value={googleSheetsUrl}
                      onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                      placeholder="請輸入 Google Sheets 分享連結（需要編輯權限）"
                      className="input"
                    />
                    <p className="help-text">
                      請確保 Google Sheets 已設定為「知道連結的使用者可以編輯」
                    </p>
                  </div>
                  
                  <button
                    onClick={exportToGoogleSheets}
                    disabled={isExportingToSheets || !googleSheetsUrl}
                    className="export-btn"
                  >
                    {isExportingToSheets ? (
                      <span className="loading-animation">
                        <span className="loading-text">輸出中</span>
                        <span className="loading-dots">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </span>
                      </span>
                    ) : '輸出到 Google Sheets'}
                  </button>
                  
                  {/* 導出結果顯示 */}
                  {exportResult && (
                    <div className="export-result">
                      <h4>CSV 數據（請複製到 Google Sheets）</h4>
                      <div className="csv-data-container">
                        <textarea
                          value={exportResult.data.csv_format}
                          readOnly
                          className="csv-data-textarea"
                          style={{
                            width: '100%',
                            height: '300px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            border: '1px solid #ccc',
                            padding: '10px'
                          }}
                        />
                      </div>
                      <div className="export-instructions">
                        <h5>操作說明：</h5>
                        <ol>
                          {exportResult.data.instructions.map((instruction, idx) => (
                            <li key={idx}>{instruction}</li>
                          ))}
                        </ol>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(exportResult.data.csv_format);
                          setMessage({ text: 'CSV 數據已複製到剪貼板！', type: 'success' });
                        }}
                        className="copy-btn"
                        style={{ marginTop: '10px' }}
                      >
                        複製 CSV 數據到剪貼板
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;