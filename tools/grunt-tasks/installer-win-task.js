var cp = require('child_process');
var os = require('os');

module.exports = function(grunt) {
    grunt.registerTask('installer-win', 'Creates setup package for the Windows platform.', function() {
        if (os.platform() === 'win32') {
            var cfg = grunt.config.get('installer-win');
            var wixRoot = 'tools\\installer-win\\';
            var ieAddonRoot = 'browser-extensions\\ie\\bin\\Release';
            var version = cfg.version;
            var arch = cfg.arch === 'x64' ? 'x64' : 'x86';
            
            cp.execFileSync('heat', 
                            [ 'file', ieAddonRoot + '\\IEAddon.dll',
                              '-srd',
                              '-gg',
                              '-cg', 'IEAddonDLL',
                              '-out', wixRoot + 'ie_addon.wxs'],
                            { stdio : 'inherit'});
                                        
            cp.execFileSync('heat', 
                            [ 'dir', 'build',
                              '-o', wixRoot + 'files.wxs',
                              '-scom',
                              '-frag',
                              '-srd',
                              '-sreg',
                              '-gg',
                              '-cg', 'ApplicationFiles',
                              '-dr', 'INSTALLFOLDER',
                              '-t', wixRoot + 'files.xslt'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', arch,
                              '-dVersion=' + version,
                              '-ext', 'WixFirewallExtension',
                              '-o', wixRoot + 'config.wixobj',
                              wixRoot + 'config.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', arch,
                              '-ext', 'WixFirewallExtension',
                              '-o', wixRoot + 'files.wixobj',
                              wixRoot + 'files.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', 'x86',
                              '-ext', 'WixFirewallExtension',
                              '-o', wixRoot + 'ie_addon.wixobj',
                              wixRoot + 'ie_addon.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('light', 
                            [ '-ext', 'WixNetFxExtension',
                              '-ext', 'WixUIExtension',
                              '-ext', 'WixFirewallExtension',
                              '-ext', 'WixUtilExtension',
                              '-spdb',
                              '-b', 'build',
                              '-b', ieAddonRoot,
                              '-o', 'dist\\oxygen-ide-' + version + '-' + cfg.arch + '.msi',
                              wixRoot + 'config.wixobj',
                              wixRoot + 'files.wixobj',
                              wixRoot + 'ie_addon.wixobj'],
                            { stdio : 'inherit'});
        }
    });
};
