const removeWhitespace = (str) => {
  return str.replace(/\s/g, '');
};

export default function ({ getService }) {
  const supertest = getService('supertest');
  const esArchiver = getService('esArchiver');

  describe('generate pdf API', () => {

    before('load reporting archive', async () => {
      await esArchiver.load('reporting/6_2');

      // If we don't include this archive, the report would generate visualizations with no data. It's included
      // here, even though we can't verify how the visualizations actually look, because the existence of data
      // means more code paths are tested. Cnsider the bug we ran into when a const keyword remained in an untranspiled
      // file. It's possible that without data, the flow of control would never have run into that keyword.
      await esArchiver.load('logstash_functional');
    });

    after(async () => {
      await esArchiver.unload('reporting/6_2');
      await esArchiver.unload('logstash_functional');
    });

    it('successfully posts a pdf job url generated from v6.2', async () => {
      // Grabbed from a report generation url from 6.2
      const jobParams = removeWhitespace(`
          (browserTimezone:America%2FNew_York,layout:(id:print),
          objectType:visualization,queryString:%27_g%3D(refreshInterval:(display:Off,pause:!!f,value:0),
          time:(from:!%272015-09-19T00:02:06.633Z!%27,interval:auto,mode:absolute,timezone:America%252FNew_York,
          to:!%272015-09-24T06:40:33.165Z!%27))%26_a%3D(filters:!!(),linked:!!f,query:(language:lucene,query:!%27!%27),
          uiState:(vis:(defaultColors:(!%270%2B-%2B1!%27:!%27rgb(247,252,245)!%27,!%271%2B-%2B2!%27:!%27rgb(199,233,192)
          !%27,!%272%2B-%2B3!%27:!%27rgb(116,196,118)!%27,!%273%2B-%2B3!%27:!%27rgb(35,139,69)!%27))),
          vis:(aggs:!!((enabled:!!t,id:!%271!%27,params:(),schema:metric,type:count),(enabled:!!t,id:!%272!%27,
          params:(field:bytes,missingBucket:!!f,missingBucketLabel:Missing,order:desc,orderBy:!%271!%27,
          otherBucket:!!f,otherBucketLabel:Other,size:5),schema:segment,type:terms),(enabled:!!t,id:!%273!%27,
          params:(field:ip,missingBucket:!!f,missingBucketLabel:Missing,order:desc,orderBy:!%271!%27,
          otherBucket:!!f,otherBucketLabel:Other,size:5),schema:group,type:terms)),params:(addLegend:!!t,
          addTooltip:!!t,colorSchema:Greens,colorsNumber:4,colorsRange:!!(),enableHover:!!f,invertColors:!!f,
          legendPosition:right,percentageMode:!!f,setColorRange:!!f,times:!!(),type:heatmap,
          valueAxes:!!((id:ValueAxis-1,labels:(color:%2523555,rotate:0,show:!!f),scale:(defaultYExtents:!!f,
          type:linear),show:!!f,type:value))),title:!%27bytes%2Bheatmap!%27,type:heatmap))%27,
          savedObjectId:dae7e680-2891-11e8-88fd-5754aa989b85)`);
      await supertest
        .post(`/api/reporting/generate/printablePdf?jobParams=${jobParams}`)
        .set('kbn-xsrf', 'xxx')
        .expect(200);
    });
  });
}
