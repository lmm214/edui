<template>
    <div class='chart' id='chart'></div>
    <div v-if="lang == 'en'">
        <div class="reborn-botton">
            <el-button @click="reborn()">Reborn</el-button>
        </div>
        <div v-show="showTable">
            <div class="count-table">
                <el-table :data="rebornCount" :table-layout="auto" size="small" style="width: 100%; font-weight: bold;">
                    <el-table-column prop="times" label="Frequency" style="width: auto;" />
                    <el-table-column prop="非洲" label="AF" width="auto" />
                    <el-table-column prop="欧洲" label="EU" width="auto" />
                    <el-table-column prop="亚洲" label="AS" width="auto" />
                </el-table>
            </div>
            <div class="count-table">
                <el-table show-header :data="rebornCount" :table-layout="auto" size="small"
                    style="width: 100%; font-weight: bold;">
                    <el-table-column prop="北美洲" label="NA" width="auto" />
                    <el-table-column prop="南美洲" label="SA" width="auto" />
                    <el-table-column prop="大洋洲" label="OA" width="auto" />
                    <el-table-column prop="南极洲" label="AN" width="auto" />
                </el-table>
            </div>
        </div>
        <div v-show="showTable" class="reborn-info">
            <el-table :data="rebornLog" :table-layout="auto" size="small" stripe style="width: 100%;">
                <el-table-column prop="times" label="Frequency" sortable style="width: auto;" />
                <el-table-column prop="continent" label="Continent" sortable width="auto" />
                <el-table-column prop="name" label="Country" sortable width="auto" />
            </el-table>
        </div>
    </div>
    <div v-else>
        <div class="reborn-botton">
            <el-button @click="reborn()">重生</el-button>
        </div>
        <div v-show="showTable">
            <div class="count-table">
                <el-table :data="rebornCount" :table-layout="auto" size="small" style="width: 100%; font-weight: bold;">
                    <el-table-column prop="times" label="重生次数" style="width: auto;" />
                    <el-table-column prop="非洲" label="非洲" width="auto" />
                    <el-table-column prop="欧洲" label="欧洲" width="auto" />
                    <el-table-column prop="亚洲" label="亚洲" width="auto" />
                </el-table>
            </div>
            <div class="count-table">
                <el-table show-header :data="rebornCount" :table-layout="auto" size="small"
                    style="width: 100%; font-weight: bold;">
                    <el-table-column prop="北美洲" label="北美洲" width="auto" />
                    <el-table-column prop="南美洲" label="南美洲" width="auto" />
                    <el-table-column prop="大洋洲" label="大洋洲" width="auto" />
                    <el-table-column prop="南极洲" label="南极洲" width="auto" />
                </el-table>
            </div>
        </div>
        <div v-show="showTable" class="reborn-info">
            <el-table :data="rebornLog" :table-layout="auto" size="small" stripe style="width: 100%;">
                <el-table-column prop="times" label="重生次数" sortable style="width: auto;" />
                <el-table-column prop="continent" label="地区" sortable width="auto" />
                <el-table-column prop="name" label="国家" sortable width="auto" />
            </el-table>
        </div>
    </div>
</template>
 
<script>
module.exports = {
    data() {
        return {
            protocol: 'http',
            url: window.location.host,
            data: {},
            coordinate: [104.195397, 35.86166], //China
            percentArray: null,
            showTable: false,
            times: 0,
            continentDict: {
                'AF': '非洲',
                'EU': '欧洲',
                'AS': '亚洲',
                'OA': '大洋洲',
                'NA': '北美洲',
                'SA': '南美洲',
                'AN': '南极洲'
            },
            rebornCount: [{
                'times': 0,
                '非洲': 0,
                '欧洲': 0,
                '亚洲': 0,
                '大洋洲': 0,
                '北美洲': 0,
                '南美洲': 0,
                '南极洲': 0
            }],
            rebornLog: [],
            zoom: 1.25,
            center: [17.228331, 26.3351]
        };
    },
    props: {
        lang: '',
    },
    mounted: function () {
        this.getData()
    },
    methods: {
        getData() {
            var that = this
            var result = `[{"total_birth": 136184741.08920002}, {"cn": "\u5b89\u9053\u5c14\u5171\u548c\u56fd", "en": "Andorra", "continent": "EU", "position": [1.32, 42.31], "birth_rate": 0.0004}, {"cn": "\u963f\u62c9\u4f2f\u8054\u5408\u914b\u957f\u56fd", "en": "United Arab Emirates", "continent": "AS", "position": [54.22, 24.28], "birth_rate": 0.0734}, {"cn": "\u963f\u5bcc\u6c57", "en": "Afghanistan", "continent": "AS", "position": [67.709953, 33.93911], "birth_rate": 0.9068}, {"cn": "\u5b89\u63d0\u74dc\u548c\u5df4\u5e03\u8fbe", "en": "Antigua and Barbuda", "continent": "NA", "position": [-61.48, 17.2], "birth_rate": 0.0011}, {"cn": "\u963f\u5c14\u5df4\u5c3c\u4e9a", "en": "Albania", "continent": "EU", "position": [20.168331, 41.153332], "birth_rate": 0.0227}, {"cn": "\u963f\u7f8e\u5c3c\u4e9a", "en": "Armenia", "continent": "AS", "position": [44.31, 40.1], "birth_rate": 0.0283}, {"cn": "\u4e0d\u4e39", "en": "Bhutan", "continent": "AS", "position": [90.433601, 27.514162], "birth_rate": 0.0097}, {"cn": "\u4f5b\u5f97\u89d2", "en": "Cabo Verde", "continent": "AF", "position": [-23.34, 15.02], "birth_rate": 0.0078}, {"cn": "\u6ce2\u9ed1", "en": "Bosnia and Herzegovina", "continent": "EU", "position": [43.8476, 18.3564], "birth_rate": 0.0192}, {"cn": "\u963f\u9c81\u5df4", "en": "Aruba", "continent": "NA", "position": [-70.02, 12.32], "birth_rate": 0.0009}, {"cn": "\u5b89\u54e5\u62c9", "en": "Angola", "continent": "AF", "position": [17.873887, -11.202692], "birth_rate": 0.9967}, {"cn": "\u963f\u6839\u5ef7", "en": "Argentina", "continent": "SA", "position": [-63.61667199999999, -38.416097], "birth_rate": 0.5718}, {"cn": "\u5965\u5730\u5229", "en": "Austria", "continent": "EU", "position": [14.550072, 47.516231], "birth_rate": 0.0592}, {"cn": "\u6fb3\u5927\u5229\u4e9a", "en": "Australia", "continent": "OA", "position": [133.775136, -25.274398], "birth_rate": 0.2268}, {"cn": "\u963f\u585e\u62dc\u7586", "en": "Azerbaijan", "continent": "AS", "position": [47.576927, 40.143105], "birth_rate": 0.0968}, {"cn": "\u5df4\u5df4\u591a\u65af", "en": "Barbados", "continent": "NA", "position": [-59.3, 13.05], "birth_rate": 0.0023}, {"cn": "\u5b5f\u52a0\u62c9\u56fd", "en": "Bangladesh", "continent": "AS", "position": [90.356331, 23.684994], "birth_rate": 2.1981}, {"cn": "\u6bd4\u5229\u65f6", "en": "Belgium", "continent": "EU", "position": [4.469936, 50.503887], "birth_rate": 0.0851}, {"cn": "\u5e03\u57fa\u7eb3\u6cd5\u7d22", "en": "Burkina Faso", "continent": "AF", "position": [-1.561593, 12.238333], "birth_rate": 0.5841}, {"cn": "\u4fdd\u52a0\u5229\u4e9a", "en": "Bulgaria", "continent": "EU", "position": [25.48583, 42.733883], "birth_rate": 0.0456}, {"cn": "\u5df4\u6797", "en": "Bahrain", "continent": "AS", "position": [50.3, 26.1], "birth_rate": 0.0167}, {"cn": "\u5e03\u9686\u8fea", "en": "Burundi", "continent": "AF", "position": [29.918886, -3.373056], "birth_rate": 0.342}, {"cn": "\u8d1d\u5b81", "en": "Benin", "continent": "AF", "position": [2.315834, 9.30769], "birth_rate": 0.32}, {"cn": "\u767e\u6155\u5927\u7fa4\u5c9b", "en": "Bermuda", "continent": "NA", "position": [-64.765816, 32.289895], "birth_rate": 0.0004}, {"cn": "\u6587\u83b1", "en": "Brunei Darussalam", "continent": "AS", "position": [114.727669, 4.535277], "birth_rate": 0.0045}, {"cn": "\u73bb\u5229\u7ef4\u4e9a", "en": "Bolivia", "continent": "SA", "position": [-63.58865299999999, -16.290154], "birth_rate": 0.1825}, {"cn": "\u5df4\u897f", "en": "Brazil", "continent": "SA", "position": [-51.92528, -14.235004], "birth_rate": 2.0428}, {"cn": "\u5df4\u54c8\u9a6c", "en": "Bahamas The", "continent": "NA", "position": [-77.39627999999999, 25.03428], "birth_rate": 0.0041}, {"cn": "\u535a\u8328\u74e6\u7eb3", "en": "Botswana", "continent": "AF", "position": [24.684866, -22.328474], "birth_rate": 0.0422}, {"cn": "\u767d\u4fc4\u7f57\u65af", "en": "Belarus", "continent": "EU", "position": [27.953389, 53.709807], "birth_rate": 0.0617}, {"cn": "\u4f2f\u5229\u5179", "en": "Belize", "continent": "NA", "position": [-88.49765, 17.189877], "birth_rate": 0.0059}, {"cn": "\u52a0\u62ff\u5927", "en": "Canada", "continent": "NA", "position": [-106.346771, 56.130366], "birth_rate": 0.2528}, {"cn": "\u5f00\u66fc\u7fa4\u5c9b", "en": "Cayman Islands", "continent": "NA", "position": [-81.24, 19.2], "birth_rate": 0.0006}, {"cn": "\u6d77\u5ce1\u7fa4\u5c9b", "en": "Channel Islands", "continent": "EU", "position": [-2.15306, 49.227503], "birth_rate": 0.0013}, {"cn": "\u4e2d\u975e\u5171\u548c\u56fd", "en": "Central African Republic", "continent": "AF", "position": [20.939444, 6.611110999999999], "birth_rate": 0.1264}, {"cn": "\u521a\u679c\u5171\u548c\u56fd", "en": "Congo Rep.", "continent": "AF", "position": [15.827659, -0.228021], "birth_rate": 0.1329}, {"cn": "\u521a\u679c\u6c11\u4e3b\u5171\u548c\u56fd", "en": "Congo Dem. Rep.", "continent": "AF", "position": [21.758664, -4.038333], "birth_rate": 2.7133}, {"cn": "\u745e\u58eb", "en": "Switzerland", "continent": "EU", "position": [8.227511999999999, 46.818188], "birth_rate": 0.0639}, {"cn": "\u514b\u7f57\u5730\u4e9a", "en": "Croatia", "continent": "EU", "position": [15.2, 45.1], "birth_rate": 0.0258}, {"cn": "\u8d64\u9053\u51e0\u5185\u4e9a", "en": "Equatorial Guinea", "continent": "AF", "position": [10.267895, 1.650801], "birth_rate": 0.0341}, {"cn": "\u79d1\u6469\u7f57", "en": "Comoros", "continent": "AF", "position": [43.872219, -11.875001], "birth_rate": 0.0202}, {"cn": "\u5384\u7acb\u7279\u91cc\u4e9a", "en": "Eritrea", "continent": "AF", "position": [39.782334, 15.179384], "birth_rate": 0.0684}, {"cn": "\u6cd5\u7f57\u7fa4\u5c9b", "en": "Faroe Islands", "continent": "EU", "position": [-6.56, 62.05], "birth_rate": 0.0005}, {"cn": "\u667a\u5229", "en": "Chile", "continent": "SA", "position": [-71.542969, -35.675147], "birth_rate": 0.1693}, {"cn": "\u5580\u9ea6\u9686", "en": "Cameroon", "continent": "AF", "position": [12.354722, 7.369721999999999], "birth_rate": 0.6797}, {"cn": "\u4e2d\u56fd", "en": "China", "continent": "AS", "position": [104.195397, 35.86166], "birth_rate": 9.3255}, {"cn": "\u54e5\u4f26\u6bd4\u4e9a", "en": "Colombia", "continent": "SA", "position": [-74.297333, 4.570868], "birth_rate": 0.527}, {"cn": "\u54e5\u65af\u8fbe\u9ece\u52a0", "en": "Costa Rica", "continent": "NA", "position": [-83.753428, 9.748916999999999], "birth_rate": 0.0491}, {"cn": "\u6377\u514b", "en": "Czechia", "continent": "EU", "position": [14.22, 50.05], "birth_rate": 0.0786}, {"cn": "\u53e4\u5df4", "en": "Cuba", "continent": "NA", "position": [-77.781167, 21.521757], "birth_rate": 0.0831}, {"cn": "\u585e\u6d66\u8def\u65af", "en": "Cyprus", "continent": "AS", "position": [33.429859, 35.126413], "birth_rate": 0.0089}, {"cn": "\u5fb7\u56fd", "en": "Germany", "continent": "EU", "position": [10.451526, 51.165691], "birth_rate": 0.5494}, {"cn": "\u5409\u5e03\u63d0", "en": "Djibouti", "continent": "AF", "position": [42.590275, 11.825138], "birth_rate": 0.0155}, {"cn": "\u4e39\u9ea6", "en": "Denmark", "continent": "EU", "position": [9.501785, 56.26392], "birth_rate": 0.043}, {"cn": "\u591a\u7c73\u5c3c\u52a0\u5171\u548c\u56fd", "en": "Dominican Republic", "continent": "NA", "position": [-69.59, 18.3], "birth_rate": 0.1528}, {"cn": "\u963f\u5c14\u53ca\u5229\u4e9a", "en": "Algeria", "continent": "AF", "position": [1.659626, 28.033886], "birth_rate": 0.7535}, {"cn": "\u5384\u74dc\u591a\u5c14", "en": "Ecuador", "continent": "SA", "position": [-78.18340599999999, -1.831239], "birth_rate": 0.2496}, {"cn": "\u7231\u6c99\u5c3c\u4e9a", "en": "Estonia", "continent": "EU", "position": [25.013607, 58.595272], "birth_rate": 0.0098}, {"cn": "\u57c3\u53ca", "en": "Egypt Arab Rep.", "continent": "AF", "position": [30.802498, 26.820553], "birth_rate": 1.9139}, {"cn": "\u897f\u73ed\u7259", "en": "Spain", "continent": "EU", "position": [-3.74922, 40.46366700000001], "birth_rate": 0.2433}, {"cn": "\u57c3\u585e\u4fc4\u6bd4\u4e9a", "en": "Ethiopia", "continent": "AF", "position": [40.489673, 9.145000000000001], "birth_rate": 2.6832}, {"cn": "\u82ac\u5170", "en": "Finland", "continent": "EU", "position": [25.748151, 61.92410999999999], "birth_rate": 0.0326}, {"cn": "\u6590\u6d4e", "en": "Fiji", "continent": "OA", "position": [178.3, -18.06], "birth_rate": 0.0139}, {"cn": "\u6cd5\u56fd", "en": "France", "continent": "EU", "position": [2.213749, 46.227638], "birth_rate": 0.5452}, {"cn": "\u52a0\u84ec", "en": "Gabon", "continent": "AF", "position": [11.609444, -0.803689], "birth_rate": 0.0502}, {"cn": "\u82f1\u56fd", "en": "United Kingdom", "continent": "EU", "position": [-3.435973, 55.378051], "birth_rate": 0.4944}, {"cn": "\u683c\u6797\u7eb3\u8fbe", "en": "Grenada", "continent": "NA", "position": [-61.721782, 12.08328], "birth_rate": 0.0013}, {"cn": "\u683c\u9c81\u5409\u4e9a", "en": "Georgia", "continent": "AS", "position": [43.711615, 41.999919], "birth_rate": 0.0354}, {"cn": "\u52a0\u7eb3", "en": "Ghana", "continent": "AF", "position": [-1.023194, 7.946527], "birth_rate": 0.6757}, {"cn": "\u5188\u6bd4\u4e9a", "en": "Gambia The", "continent": "AF", "position": [-15.310139, 13.443182], "birth_rate": 0.0694}, {"cn": "\u51e0\u5185\u4e9a", "en": "Guinea", "continent": "AF", "position": [-9.696645, 9.945587], "birth_rate": 0.3568}, {"cn": "\u5e0c\u814a", "en": "Greece", "continent": "EU", "position": [21.824312, 39.074208], "birth_rate": 0.0626}, {"cn": "\u5371\u5730\u9a6c\u62c9", "en": "Guatemala", "continent": "NA", "position": [-90.23075899999999, 15.783471], "birth_rate": 0.3015}, {"cn": "\u5173\u5c9b", "en": "Guam", "continent": "OA", "position": [144.747738, 13.440083], "birth_rate": 0.002}, {"cn": "\u572d\u4e9a\u90a3", "en": "Guyana", "continent": "SA", "position": [-58.93018, 4.860416], "birth_rate": 0.011}, {"cn": "\u9999\u6e2f(\u4e2d\u56fd)", "en": "Hong Kong SAR China", "continent": "AS", "position": [114.213137, 22.279452], "birth_rate": 0.0327}, {"cn": "\u6d2a\u90fd\u62c9\u65af", "en": "Honduras", "continent": "NA", "position": [-86.241905, 15.199999], "birth_rate": 0.1552}, {"cn": "\u6d77\u5730", "en": "Haiti", "continent": "NA", "position": [-72.285215, 18.971187], "birth_rate": 0.2034}, {"cn": "\u5308\u7259\u5229", "en": "Hungary", "continent": "EU", "position": [19.503304, 47.162494], "birth_rate": 0.0713}, {"cn": "\u5370\u5ea6\u5c3c\u897f\u4e9a", "en": "Indonesia", "continent": "AS", "position": [106.515414, -6.10304], "birth_rate": 3.4498}, {"cn": "\u7231\u5c14\u5170", "en": "Ireland", "continent": "EU", "position": [-8.24389, 53.41291], "birth_rate": 0.0406}, {"cn": "\u4ee5\u8272\u5217", "en": "Israel", "continent": "AS", "position": [34.851612, 31.046051], "birth_rate": 0.1306}, {"cn": "\u5370\u5ea6", "en": "India", "continent": "AS", "position": [78.96288, 20.593684], "birth_rate": 17.394}, {"cn": "\u4f0a\u62c9\u514b", "en": "Iraq", "continent": "AS", "position": [43.679291, 33.223191], "birth_rate": 0.8467}, {"cn": "\u4f0a\u6717", "en": "Iran Islamic Rep.", "continent": "AS", "position": [53.688046, 32.427908], "birth_rate": 1.1239}, {"cn": "\u51b0\u5c9b", "en": "Iceland", "continent": "EU", "position": [-19.020835, 64.963051], "birth_rate": 0.0033}, {"cn": "\u610f\u5927\u5229", "en": "Italy", "continent": "EU", "position": [12.56738, 41.87194], "birth_rate": 0.3036}, {"cn": "\u79d1\u7279\u8fea\u74e6", "en": "Cote d'Ivoire", "continent": "AF", "position": [-5.17, 6.49], "birth_rate": 0.6953}, {"cn": "\u7259\u4e70\u52a0", "en": "Jamaica", "continent": "NA", "position": [-77.297508, 18.109581], "birth_rate": 0.0349}, {"cn": "\u7ea6\u65e6", "en": "Jordan", "continent": "AS", "position": [36.238414, 30.585164], "birth_rate": 0.1584}, {"cn": "\u65e5\u672c", "en": "Japan", "continent": "AS", "position": [138.252924, 36.204824], "birth_rate": 0.646}, {"cn": "\u80af\u5c3c\u4e9a", "en": "Kenya", "continent": "AF", "position": [37.906193, -0.023559], "birth_rate": 1.1305}, {"cn": "\u5409\u5c14\u5409\u65af\u5766", "en": "Kyrgyz Republic", "continent": "AS", "position": [74.46, 42.54], "birth_rate": 0.118}, {"cn": "\u67ec\u57d4\u5be8", "en": "Cambodia", "continent": "AS", "position": [104.990963, 12.565679], "birth_rate": 0.2738}, {"cn": "\u671d\u9c9c", "en": "Korea Dem. People's Rep.", "continent": "AS", "position": [127.510093, 40.339852], "birth_rate": 0.2661}, {"cn": "\u97e9\u56fd", "en": "Korea Rep.", "continent": "AS", "position": [127.766922, 35.907757], "birth_rate": 0.19}, {"cn": "\u79d1\u5a01\u7279", "en": "Kuwait", "continent": "AS", "position": [47.481766, 29.31166], "birth_rate": 0.0413}, {"cn": "\u54c8\u8428\u514b\u65af\u5766", "en": "Kazakhstan", "continent": "AS", "position": [66.923684, 48.019573], "birth_rate": 0.3209}, {"cn": "\u8001\u631d", "en": "Lao PDR", "continent": "AS", "position": [102.495496, 19.85627], "birth_rate": 0.1246}, {"cn": "\u9ece\u5df4\u5ae9", "en": "Lebanon", "continent": "AS", "position": [35.862285, 33.854721], "birth_rate": 0.0845}, {"cn": "\u5723\u5362\u897f\u4e9a", "en": "St. Lucia", "continent": "NA", "position": [-60.58, 14.02], "birth_rate": 0.0016}, {"cn": "\u5217\u652f\u6566\u58eb\u767b", "en": "Liechtenstein", "continent": "EU", "position": [9.31, 47.08], "birth_rate": 0.0003}, {"cn": "\u65af\u91cc\u5170\u5361", "en": "Sri Lanka", "continent": "AS", "position": [80.77179699999999, 7.873053999999999], "birth_rate": 0.244}, {"cn": "\u5229\u6bd4\u91cc\u4e9a", "en": "Liberia", "continent": "AF", "position": [-9.429499000000002, 6.428055], "birth_rate": 0.1217}, {"cn": "\u83b1\u7d22\u6258", "en": "Lesotho", "continent": "AF", "position": [28.233608, -29.609988], "birth_rate": 0.0412}, {"cn": "\u7acb\u9676\u5b9b", "en": "Lithuania", "continent": "EU", "position": [23.881275, 55.169438], "birth_rate": 0.0185}, {"cn": "\u5362\u68ee\u5821", "en": "Luxembourg", "continent": "EU", "position": [6.129582999999999, 49.815273], "birth_rate": 0.0047}, {"cn": "\u62c9\u8131\u7ef4\u4e9a", "en": "Latvia", "continent": "EU", "position": [24.603189, 56.879635], "birth_rate": 0.0124}, {"cn": "\u5229\u6bd4\u4e9a", "en": "Libya", "continent": "AF", "position": [17.228331, 26.3351], "birth_rate": 0.092}, {"cn": "\u6469\u6d1b\u54e5", "en": "Morocco", "continent": "AF", "position": [-7.092619999999999, 31.791702], "birth_rate": 0.4936}, {"cn": "\u6469\u7eb3\u54e5", "en": "Monaco", "continent": "EU", "position": [7.414268, 43.735708], "birth_rate": 0.0002}, {"cn": "\u6469\u5c14\u591a\u74e6", "en": "Moldova", "continent": "EU", "position": [28.369885, 47.411631], "birth_rate": 0.0189}, {"cn": "\u9a6c\u8fbe\u52a0\u65af\u52a0", "en": "Madagascar", "continent": "AF", "position": [46.869107, -18.766947], "birth_rate": 0.668}, {"cn": "\u9a6c\u91cc", "en": "Mali", "continent": "AF", "position": [-3.996166, 17.570692], "birth_rate": 0.6279}, {"cn": "\u7f05\u7538", "en": "Myanmar", "continent": "AS", "position": [95.956223, 21.913965], "birth_rate": 0.6841}, {"cn": "\u8499\u53e4", "en": "Mongolia", "continent": "AS", "position": [103.846656, 46.862496], "birth_rate": 0.0562}, {"cn": "\u6fb3\u95e8\uff08\u4e2d\u56fd\uff09", "en": "Macao SAR China", "continent": "AS", "position": [113.578035, 22.14523], "birth_rate": 0.0053}, {"cn": "\u9a6c\u8033\u4ed6", "en": "Malta", "continent": "EU", "position": [14.31, 35.54], "birth_rate": 0.0034}, {"cn": "\u9a6c\u91cc\u4e9a\u90a3\u7fa4\u5c9b", "en": "Northern Mariana Islands", "continent": "OA", "position": [145.45, 15.12], "birth_rate": 0.0006}, {"cn": "\u9a6c\u63d0\u5c3c\u514b", "en": "St. Martin (French part)", "continent": "NA", "position": [-61.02, 14.36], "birth_rate": 0.0004}, {"cn": "\u6bdb\u91cc\u6c42\u65af", "en": "Mauritius", "continent": "AF", "position": [57.559051, -20.246695], "birth_rate": 0.0102}, {"cn": "\u9a6c\u5c14\u4ee3\u592b", "en": "Maldives", "continent": "AS", "position": [73.28, 4.0], "birth_rate": 0.0052}, {"cn": "\u9a6c\u62c9\u7ef4", "en": "Malawi", "continent": "AF", "position": [34.301525, -13.254308], "birth_rate": 0.4761}, {"cn": "\u58a8\u897f\u54e5", "en": "Mexico", "continent": "NA", "position": [-102.552784, 23.634501], "birth_rate": 1.6261}, {"cn": "\u9a6c\u6765\u897f\u4e9a", "en": "Malaysia", "continent": "AS", "position": [101.975766, 4.210484], "birth_rate": 0.3851}, {"cn": "\u83ab\u6851\u6bd4\u514b", "en": "Mozambique", "continent": "AF", "position": [35.529562, -18.665695], "birth_rate": 0.8738}, {"cn": "\u7eb3\u7c73\u6bd4\u4e9a", "en": "Namibia", "continent": "AF", "position": [18.49041, -22.95764], "birth_rate": 0.0532}, {"cn": "\u5c3c\u65e5\u5c14", "en": "Niger", "continent": "AF", "position": [8.081666, 17.607789], "birth_rate": 0.8304}, {"cn": "\u5c3c\u65e5\u5229\u4e9a", "en": "Nigeria", "continent": "AF", "position": [8.675277, 9.081999], "birth_rate": 5.7435}, {"cn": "\u5c3c\u52a0\u62c9\u74dc", "en": "Nicaragua", "continent": "NA", "position": [-85.207229, 12.865416], "birth_rate": 0.0984}, {"cn": "\u8377\u5170", "en": "Netherlands", "continent": "EU", "position": [5.291265999999999, 52.132633], "birth_rate": 0.1287}, {"cn": "\u632a\u5a01", "en": "Norway", "continent": "EU", "position": [8.468945999999999, 60.47202399999999], "birth_rate": 0.0397}, {"cn": "\u5c3c\u6cca\u5c14", "en": "Nepal", "continent": "AS", "position": [84.12400799999999, 28.394857], "birth_rate": 0.414}, {"cn": "\u65b0\u897f\u5170", "en": "New Zealand", "continent": "OA", "position": [174.885971, -40.900557], "birth_rate": 0.0414}, {"cn": "\u963f\u66fc", "en": "Oman", "continent": "AS", "position": [55.923255, 21.512583], "birth_rate": 0.069}, {"cn": "\u5df4\u62ff\u9a6c", "en": "Panama", "continent": "NA", "position": [-80.782127, 8.537981], "birth_rate": 0.0579}, {"cn": "\u79d8\u9c81", "en": "Peru", "continent": "SA", "position": [-75.015152, -9.189967], "birth_rate": 0.4409}, {"cn": "\u6cd5\u5c5e\u73bb\u5229\u5c3c\u897f\u4e9a", "en": "French Polynesia", "continent": "OA", "position": [-149.34, -17.32], "birth_rate": 0.0029}, {"cn": "\u5df4\u5e03\u4e9a\u65b0\u51e0\u5185\u4e9a", "en": "Papua New Guinea", "continent": "OA", "position": [143.95555, -6.314992999999999], "birth_rate": 0.1808}, {"cn": "\u83f2\u5f8b\u5bbe", "en": "Philippines", "continent": "AS", "position": [121.774017, 12.879721], "birth_rate": 1.6308}, {"cn": "\u5df4\u57fa\u65af\u5766", "en": "Pakistan", "continent": "AS", "position": [69.34511599999999, 30.375321], "birth_rate": 4.4648}, {"cn": "\u6ce2\u5170", "en": "Poland", "continent": "EU", "position": [19.145136, 51.919438], "birth_rate": 0.2497}, {"cn": "\u6ce2\u591a\u9ece\u5404", "en": "Puerto Rico", "continent": "NA", "position": [-66.590149, 18.220833], "birth_rate": 0.0144}, {"cn": "\u8461\u8404\u7259", "en": "Portugal", "continent": "EU", "position": [-8.224454, 39.39987199999999], "birth_rate": 0.0605}, {"cn": "\u5df4\u62c9\u572d", "en": "Paraguay", "continent": "SA", "position": [-58.443832, -23.442503], "birth_rate": 0.106}, {"cn": "\u5361\u5854\u5c14", "en": "Qatar", "continent": "AS", "position": [51.183884, 25.354826], "birth_rate": 0.0194}, {"cn": "\u7f57\u9a6c\u5c3c\u4e9a", "en": "Romania", "continent": "EU", "position": [24.96676, 45.943161], "birth_rate": 0.1263}, {"cn": "\u4fc4\u7f57\u65af", "en": "Russian Federation", "continent": "EU", "position": [105.318756, 61.52401], "birth_rate": 1.0533}, {"cn": "\u6c99\u7279\u963f\u62c9\u4f2f", "en": "Saudi Arabia", "continent": "AS", "position": [45.079162, 23.885942], "birth_rate": 0.4412}, {"cn": "\u6240\u7f57\u95e8\u7fa4\u5c9b", "en": "Solomon Islands", "continent": "OA", "position": [160.156194, -9.64571], "birth_rate": 0.016}, {"cn": "\u585e\u820c\u5c14", "en": "Seychelles", "continent": "AF", "position": [55.452883, -4.651018], "birth_rate": 0.0012}, {"cn": "\u82cf\u4e39", "en": "Sudan", "continent": "AF", "position": [30.217636, 12.862807], "birth_rate": 1.0223}, {"cn": "\u745e\u5178", "en": "Sweden", "continent": "EU", "position": [18.643501, 60.12816100000001], "birth_rate": 0.0841}, {"cn": "\u65b0\u52a0\u5761", "en": "Singapore", "continent": "AS", "position": [103.86123, 1.356423], "birth_rate": 0.036}, {"cn": "\u65af\u6d1b\u6587\u5c3c\u4e9a", "en": "Slovenia", "continent": "EU", "position": [14.995463, 46.151241], "birth_rate": 0.0139}, {"cn": "\u65af\u6d1b\u4f10\u514b", "en": "Slovak Republic", "continent": "EU", "position": [19.699024, 48.669026], "birth_rate": 0.04}, {"cn": "\u585e\u62c9\u5229\u6602", "en": "Sierra Leone", "continent": "AF", "position": [-11.779889, 8.460555], "birth_rate": 0.1913}, {"cn": "\u5723\u9a6c\u529b\u8bfa", "en": "San Marino", "continent": "EU", "position": [12.3, 43.55], "birth_rate": 0.0001}, {"cn": "\u4e1c\u8428\u6469\u4e9a(\u7f8e)", "en": "American Samoa", "continent": "OA", "position": [-170.43, -14.16], "birth_rate": 0.0005}, {"cn": "\u897f\u8428\u6469\u4e9a", "en": "Samoa", "continent": "OA", "position": [-171.5, -13.5], "birth_rate": 0.0035}, {"cn": "\u585e\u5185\u52a0\u5c14", "en": "Senegal", "continent": "AF", "position": [-14.452362, 14.497401], "birth_rate": 0.4167}, {"cn": "\u7d22\u9a6c\u91cc", "en": "Somalia", "continent": "AF", "position": [46.199616, 5.152149], "birth_rate": 0.4925}, {"cn": "\u82cf\u91cc\u5357", "en": "Suriname", "continent": "SA", "position": [-56.027783, 3.919305], "birth_rate": 0.0078}, {"cn": "\u5723\u591a\u7f8e\u548c\u666e\u6797\u897f\u6bd4", "en": "Sao Tome and Principe", "continent": "AF", "position": [6.39, 0.1], "birth_rate": 0.0051}, {"cn": "\u8428\u5c14\u74e6\u591a", "en": "El Salvador", "continent": "NA", "position": [-88.89653, 13.794185], "birth_rate": 0.0862}, {"cn": "\u53d9\u5229\u4e9a", "en": "Syrian Arab Republic", "continent": "AS", "position": [38.996815, 34.80207499999999], "birth_rate": 0.3087}, {"cn": "\u65af\u5a01\u58eb\u5170", "en": "Eswatini", "continent": "AF", "position": [31.465866, -26.522503], "birth_rate": 0.0215}, {"cn": "\u4e4d\u5f97", "en": "Chad", "continent": "AF", "position": [18.732207, 15.454166], "birth_rate": 0.5092}, {"cn": "\u591a\u54e5", "en": "Togo", "continent": "AF", "position": [0.824782, 8.619543], "birth_rate": 0.1992}, {"cn": "\u6cf0\u56fd", "en": "Thailand", "continent": "AS", "position": [100.992541, 15.870032], "birth_rate": 0.5136}, {"cn": "\u5854\u5409\u514b\u65af\u5766", "en": "Tajikistan", "continent": "AS", "position": [71.276093, 38.861034], "birth_rate": 0.2076}, {"cn": "\u571f\u5e93\u66fc\u65af\u5766", "en": "Turkmenistan", "continent": "AS", "position": [59.556278, 38.969719], "birth_rate": 0.0988}, {"cn": "\u7a81\u5c3c\u65af", "en": "Tunisia", "continent": "AF", "position": [9.537499, 33.886917], "birth_rate": 0.149}, {"cn": "\u6c64\u52a0", "en": "Tonga", "continent": "OA", "position": [-174.0, -21.1], "birth_rate": 0.0019}, {"cn": "\u571f\u8033\u5176", "en": "Turkiye", "continent": "AS", "position": [35.243322, 38.963745], "birth_rate": 0.9991}, {"cn": "\u7279\u7acb\u5c3c\u8fbe\u548c\u591a\u5df4\u54e5", "en": "Trinidad and Tobago", "continent": "NA", "position": [-61.275187, 10.468494], "birth_rate": 0.0124}, {"cn": "\u5766\u6851\u5c3c\u4e9a", "en": "Tanzania", "continent": "AF", "position": [35.45, -6.08], "birth_rate": 1.6257}, {"cn": "\u4e4c\u514b\u5170", "en": "Ukraine", "continent": "EU", "position": [31.16558, 48.379433], "birth_rate": 0.2574}, {"cn": "\u4e4c\u5e72\u8fbe", "en": "Uganda", "continent": "AF", "position": [32.290275, 1.373333], "birth_rate": 1.2803}, {"cn": "\u7f8e\u56fd", "en": "United States", "continent": "NA", "position": [-95.712891, 37.09024], "birth_rate": 2.6808}, {"cn": "\u4e4c\u62c9\u572d", "en": "Uruguay", "continent": "SA", "position": [-55.765835, -32.522779], "birth_rate": 0.0358}, {"cn": "\u4e4c\u5179\u522b\u514b\u65af\u5766", "en": "Uzbekistan", "continent": "AS", "position": [64.585262, 41.377491], "birth_rate": 0.641}, {"cn": "\u59d4\u5185\u745e\u62c9", "en": "Venezuela RB", "continent": "SA", "position": [-66.58973, 6.42375], "birth_rate": 0.3583}, {"cn": "\u8d8a\u5357", "en": "Vietnam", "continent": "AS", "position": [108.277199, 14.058324], "birth_rate": 1.1534}, {"cn": "\u4e5f\u95e8", "en": "Yemen Rep.", "continent": "AS", "position": [48.516388, 15.552727], "birth_rate": 0.6493}, {"cn": "\u585e\u5c14\u7ef4\u4e9a", "en": "Serbia", "continent": "EU", "position": [20.922496, 44.018803], "birth_rate": 0.0452}, {"cn": "\u5357\u975e", "en": "South Africa", "continent": "AF", "position": [22.937506, -30.559482], "birth_rate": 0.8818}, {"cn": "\u8d5e\u6bd4\u4e9a", "en": "Zambia", "continent": "AF", "position": [27.849332, -13.133897], "birth_rate": 0.4863}, {"cn": "\u6d25\u5df4\u5e03\u97e6", "en": "Zimbabwe", "continent": "AF", "position": [29.154857, -19.015438], "birth_rate": 0.3214}, {"cn": "\u683c\u9675\u5170", "en": "Greenland", "continent": "NA", "position": [-42.604303, 71.706936], "birth_rate": 0.0006}, {"cn": "\u51e0\u5185\u4e9a\u6bd4\u7ecd", "en": "Guinea-Bissau", "continent": "AF", "position": [-15.180413, 11.803749], "birth_rate": 0.0503}, {"cn": "\u57fa\u91cc\u5df4\u65af", "en": "Kiribati", "continent": "OA", "position": [173.0, 1.3], "birth_rate": 0.0024}, {"cn": "\u79d1\u7d22\u6c83", "en": "Kosovo", "continent": "EU", "position": [20.902977, 42.6026359], "birth_rate": 0.0199}, {"cn": "\u6bdb\u91cc\u5854\u5c3c\u4e9a", "en": "Mauritania", "continent": "AF", "position": [-10.940835, 21.00789], "birth_rate": 0.1157}, {"cn": "\u5bc6\u514b\u7f57\u5c3c\u897f\u4e9a\u8054\u90a6", "en": "Micronesia Fed. Sts.", "continent": "OA", "position": [158.09, 6.55], "birth_rate": 0.002}, {"cn": "\u9ed1\u5c71", "en": "Montenegro", "continent": "EU", "position": [19.37439, 42.708678], "birth_rate": 0.005}, {"cn": "\u65b0\u5580\u91cc\u591a\u5c3c\u4e9a", "en": "New Caledonia", "continent": "OA", "position": [165.618042, -20.904305], "birth_rate": 0.0028}, {"cn": "\u9a6c\u5176\u987f", "en": "North Macedonia", "continent": "EU", "position": [21.745275, 41.608635], "birth_rate": 0.0136}, {"cn": "\u5e15\u52b3", "en": "Palau", "continent": "OA", "position": [134.28, 7.2], "birth_rate": 0.0001}, {"cn": "\u5362\u65fa\u8fbe", "en": "Rwanda", "continent": "AF", "position": [29.873888, -1.940278], "birth_rate": 0.3022}, {"cn": "\u5357\u82cf\u4e39", "en": "South Sudan", "continent": "AF", "position": [31.3069788, 6.876991899999999], "birth_rate": 0.2841}, {"cn": "\u5723\u57fa\u8328\u548c\u5c3c\u7ef4\u65af", "en": "St. Kitts and Nevis", "continent": "NA", "position": [-62.43, 17.17], "birth_rate": 0.0004}, {"cn": "\u5723\u6587\u68ee\u7279\u548c\u683c\u6797\u7eb3\u4e01\u65af", "en": "St. Vincent and the Grenadines", "continent": "NA", "position": [-61.1, 13.1], "birth_rate": 0.0011}, {"cn": "\u7f8e\u5c5e\u7ef4\u5c14\u4eac\u7fa4\u5c9b", "en": "Virgin Islands (U.S.)", "continent": "NA", "position": [-64.56, 18.21], "birth_rate": 0.0009}, {"cn": "\u4e1c\u5e1d\u6c76", "en": "Timor-Leste", "continent": "AS", "position": [125.727539, -8.874217], "birth_rate": 0.0286}, {"cn": "\u74e6\u52aa\u963f\u56fe", "en": "Vanuatu", "continent": "OA", "position": [166.959158, -15.376706], "birth_rate": 0.0067}, {"cn": "\u53f0\u6e7e\uff08\u4e2d\u56fd\uff09", "en": "Taiwan", "continent": "AS", "position": [120.967428, 23.880654], "birth_rate": 0.1428}]`
            that.data = eval(result)
            this.init()
        },
        init() {
            this.myChart = echarts.init(document.getElementById('chart'))
            this.myChart.setOption(this.option());
        },
        reborn() {
            let total = 100000
            if (this.percentArray == null) {
                this.percentArray = new Array();
                for (let i = 0; i < this.data.length; i++) {
                    let percent = this.data[i]['birth_rate'] * 1000
                    for (let j = 0; j < percent; j++) {
                        this.percentArray.push(i)
                    }
                }
            }
            let rand = Math.floor(Math.random() * total)
            let result = this.data[this.percentArray[rand]]
            console.log(result)

            this.coordinate = result['position']
            this.center = result['position']
            this.times += 1
            let temp_dict = {}
            temp_dict['times'] = this.times
            temp_dict['name'] = this.lang == 'en' ? result['en'] : result['cn']
            temp_dict['continent'] = this.lang == 'en' ? result['continent'] : this.continentDict[result['continent']]
            this.rebornLog.unshift(temp_dict)

            this.rebornCount[0]['times'] = this.times
            this.rebornCount[0][this.continentDict[result['continent']]] += 1

            this.showTable = true
            this.zoom = 2.0
            this.myChart.setOption(this.option())
        },
        option() {
            return {
                backgroundColor: '#E8E8E8',
                geo: {
                    map: 'world',
                    roam: true,
                    zoom: this.zoom,
                    label: {
                        emphasis: {
                            show: false,
                        }
                    },
                    center: this.center,
                    tooltip: {
                        show: true
                    },
                    // silent: true,
                    itemStyle: {
                        normal: {
                            areaColor: '#CFCFCF',
                            borderColor: '#111'
                        },
                        emphasis: {
                            areaColor: '#2a333d'
                        }
                    }
                },
                series: {
                    type: 'custom',
                    coordinateSystem: 'geo',
                    geoIndex: 0,
                    zlevel: 1,
                    data: [
                        this.coordinate
                    ],
                    renderItem(params, api) {
                        const coord = api.coord([
                            api.value(0, params.dataIndex),
                            api.value(1, params.dataIndex)
                        ]);
                        const circles = [];
                        for (let i = 0; i < 5; i++) {
                            circles.push({
                                type: 'circle',
                                shape: {
                                    cx: 0,
                                    cy: 0,
                                    r: 30
                                },
                                style: {
                                    stroke: 'red',
                                    fill: 'none',
                                    lineWidth: 2
                                },
                                // Ripple animation
                                keyframeAnimation: {
                                    duration: 4000,
                                    loop: true,
                                    delay: (-i / 4) * 4000,
                                    keyframes: [
                                        {
                                            percent: 0,
                                            scaleX: 0,
                                            scaleY: 0,
                                            style: {
                                                opacity: 1
                                            }
                                        },
                                        {
                                            percent: 1,
                                            scaleX: 1,
                                            scaleY: 0.4,
                                            style: {
                                                opacity: 0
                                            }
                                        }
                                    ]
                                }
                            });
                        }
                        return {
                            type: 'group',
                            x: coord[0],
                            y: coord[1],
                            children: [
                                ...circles,
                                {
                                    type: 'path',
                                    shape: {
                                        d: 'M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zM16 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z',
                                        x: -10,
                                        y: -35,
                                        width: 20,
                                        height: 40
                                    },
                                    style: {
                                        fill: 'red'
                                    },
                                    // Jump animation.
                                    keyframeAnimation: {
                                        duration: 1000,
                                        loop: true,
                                        delay: Math.random() * 1000,
                                        keyframes: [
                                            {
                                                y: -10,
                                                percent: 0.5,
                                                easing: 'cubicOut'
                                            },
                                            {
                                                y: 0,
                                                percent: 1,
                                                easing: 'bounceOut'
                                            }
                                        ]
                                    }
                                }
                            ]
                        };
                    }
                }
            }
        }
    }
}
</script>
 
<style>

</style>