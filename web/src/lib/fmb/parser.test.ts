import { describe, it, expect } from 'vitest';
import { parseFmbXml } from './parser';

const MINIMAL_FMB_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Module Name="TEST_FORM" Title="Test Form">
  <Block Name="HEADER_BLK" QueryDataSourceName="TEST_TABLE" SingleRecord="true">
    <Item Name="FIELD1" ItemType="TEXT_ITEM" Prompt="Field One"
          Canvas="MAIN_CANVAS" DataType="CHAR" MaximumLength="30"
          Required="true" Enabled="true" Visible="true" LOVName="LOV_FIELD1" />
    <Item Name="CHK1" ItemType="CHECK_BOX" Prompt="Active"
          Canvas="MAIN_CANVAS" />
    <Trigger Name="WHEN-NEW-BLOCK-INSTANCE" TriggerType="BUILTIN" TriggerText="some code" />
  </Block>
  <Block Name="DETAIL_BLK" QueryDataSourceName="DETAIL_TABLE" SingleRecord="false">
    <Item Name="COL1" ItemType="TEXT_ITEM" Prompt="Column One"
          Canvas="MAIN_CANVAS" TabPage="TAB_DETAIL" />
    <Item Name="BTN1" ItemType="PUSH_BUTTON" Prompt="Save" />
    <Item Name="LIST1" ItemType="LIST_ITEM" Prompt="Status" />
    <Item Name="DISP1" ItemType="DISPLAY_ITEM" Prompt="Info" />
  </Block>
  <Canvas Name="MAIN_CANVAS" CanvasType="TAB">
    <TabPage Name="TAB_MAIN" Label="Main" />
    <TabPage Name="TAB_DETAIL" Label="Detail" />
  </Canvas>
  <LOV Name="LOV_FIELD1" Title="Select Field1" />
  <Trigger Name="ON-ERROR" TriggerType="BUILTIN" TriggerText="error handler" />
</Module>`;

describe('parseFmbXml', () => {
  it('should parse module name and title', () => {
    const result = parseFmbXml(MINIMAL_FMB_XML);
    expect(result.name).toBe('TEST_FORM');
    expect(result.title).toBe('Test Form');
  });

  it('should parse blocks', () => {
    const result = parseFmbXml(MINIMAL_FMB_XML);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].name).toBe('HEADER_BLK');
    expect(result.blocks[0].queryDataSource).toBe('TEST_TABLE');
    expect(result.blocks[0].singleRecord).toBe(true);
    expect(result.blocks[1].name).toBe('DETAIL_BLK');
    expect(result.blocks[1].singleRecord).toBe(false);
  });

  it('should parse items within blocks', () => {
    const result = parseFmbXml(MINIMAL_FMB_XML);
    const headerBlock = result.blocks[0];
    expect(headerBlock.items).toHaveLength(2); // TEXT_ITEM + CHECK_BOX

    const field1 = headerBlock.items[0];
    expect(field1.name).toBe('FIELD1');
    expect(field1.itemType).toBe('TEXT_ITEM');
    expect(field1.prompt).toBe('Field One');
    expect(field1.canvas).toBe('MAIN_CANVAS');
    expect(field1.dataType).toBe('CHAR');
    expect(field1.maximumLength).toBe(30);
    expect(field1.required).toBe(true);
    expect(field1.lovName).toBe('LOV_FIELD1');

    const chk = headerBlock.items[1];
    expect(chk.itemType).toBe('CHECK_BOX');
  });

  it('should parse detail block items', () => {
    const result = parseFmbXml(MINIMAL_FMB_XML);
    const detailBlock = result.blocks[1];
    expect(detailBlock.items).toHaveLength(4);
    expect(detailBlock.items[0].tabPage).toBe('TAB_DETAIL');
    expect(detailBlock.items[1].itemType).toBe('PUSH_BUTTON');
    expect(detailBlock.items[2].itemType).toBe('LIST_ITEM');
    expect(detailBlock.items[3].itemType).toBe('DISPLAY_ITEM');
  });

  it('should parse block-level triggers', () => {
    const result = parseFmbXml(MINIMAL_FMB_XML);
    expect(result.blocks[0].triggers).toHaveLength(1);
    expect(result.blocks[0].triggers[0].name).toBe('WHEN-NEW-BLOCK-INSTANCE');
    expect(result.blocks[0].triggers[0].triggerText).toBe('some code');
  });

  it('should parse canvases and tab pages', () => {
    const result = parseFmbXml(MINIMAL_FMB_XML);
    expect(result.canvases).toHaveLength(1);
    expect(result.canvases[0].name).toBe('MAIN_CANVAS');
    expect(result.canvases[0].canvasType).toBe('TAB');
    expect(result.canvases[0].tabPages).toHaveLength(2);
    expect(result.canvases[0].tabPages[0].label).toBe('Main');
  });

  it('should parse LOVs', () => {
    const result = parseFmbXml(MINIMAL_FMB_XML);
    expect(result.lovs).toHaveLength(1);
    expect(result.lovs[0].name).toBe('LOV_FIELD1');
    expect(result.lovs[0].title).toBe('Select Field1');
  });

  it('should parse module-level triggers', () => {
    const result = parseFmbXml(MINIMAL_FMB_XML);
    expect(result.triggers).toHaveLength(1);
    expect(result.triggers[0].name).toBe('ON-ERROR');
  });

  it('should throw on invalid XML', () => {
    expect(() => parseFmbXml('<invalid')).toThrow();
  });

  it('should throw when Module element is missing', () => {
    expect(() => parseFmbXml('<?xml version="1.0"?><Root></Root>')).toThrow(/Module/);
  });
});

// Real Oracle frmf2xml format with namespaced attributes and FormModule wrapper
const REAL_FMB_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Module version="101020002" xmlns:MYFORM_default="http://xmlns.oracle.com/Forms" xmlns:MYFORM_overridden="http://xmlns.oracle.com/Forms" xmlns:FORM_STD_inherited="http://xmlns.oracle.com/Forms" xmlns:MYFORM_inherited_overridden="http://xmlns.oracle.com/Forms" xmlns="http://xmlns.oracle.com/Forms">
  <FormModule MYFORM_overridden:Name="MYFORM" MYFORM_overridden:Title="My Application" MYFORM_default:MaximumRecordsFetched="0">
    <Block MYFORM_overridden:Name="B1_HEADER" MYFORM_default:QueryDataSourceName="HEADER_TABLE" MYFORM_default:SingleRecord="false" FORM_STD_inherited:DatabaseBlock="true">
      <Item MYFORM_overridden:Name="FIELD_A" FORM_STD_inherited:ItemType="Text Item" MYFORM_overridden:Prompt="Field A" FORM_STD_inherited:CanvasName="CVS_MAIN" FORM_STD_inherited:DataType="Char" FORM_STD_inherited:MaximumLength="50" FORM_STD_inherited:Required="true" MYFORM_default:LovName="" MYFORM_default:TabPageName="" FORM_STD_inherited:Enabled="true" FORM_STD_inherited:Visible="true" />
      <Item MYFORM_overridden:Name="CHK_ACTIVE" FORM_STD_inherited:ItemType="Check Box" MYFORM_overridden:Prompt="Is Active" FORM_STD_inherited:CanvasName="CVS_MAIN" MYFORM_default:Required="false" />
      <Item MYFORM_overridden:Name="BTN_SAVE" FORM_STD_inherited:ItemType="Push Button" FORM_STD_inherited:Label="Save" MYFORM_default:Prompt="" FORM_STD_inherited:CanvasName="CVS_MAIN" />
      <Item MYFORM_overridden:Name="DSP_INFO" FORM_STD_inherited:ItemType="Display Item" MYFORM_overridden:Prompt="Info" FORM_STD_inherited:CanvasName="CVS_MAIN" />
    </Block>
    <Block MYFORM_overridden:Name="B2_DETAIL" MYFORM_overridden:QueryDataSourceName="DETAIL_VIEW" MYFORM_default:SingleRecord="false" FORM_STD_inherited:DatabaseBlock="true">
      <Item MYFORM_overridden:Name="COL_X" FORM_STD_inherited:ItemType="Text Item" MYFORM_overridden:Prompt="Col X" FORM_STD_inherited:CanvasName="CVS_MAIN" MYFORM_overridden:TabPageName="TAB_DET" />
      <Trigger MYFORM_overridden:Name="WHEN-NEW-RECORD-INSTANCE" MYFORM_default:TriggerStyle="PL/SQL" MYFORM_overridden:TriggerText="null;" />
    </Block>
    <Canvas MYFORM_overridden:Name="CVS_MAIN" MYFORM_overridden:CanvasType="Tab">
      <TabPage MYFORM_overridden:Name="TAB_MAIN" MYFORM_overridden:Label="Main Tab" />
      <TabPage MYFORM_overridden:Name="TAB_DET" MYFORM_overridden:Label="Detail Tab" />
    </Canvas>
    <LOV MYFORM_overridden:Name="LOV_STATUS" MYFORM_overridden:Title="Select Status" />
    <Trigger MYFORM_overridden:Name="ON-ERROR" MYFORM_default:TriggerStyle="PL/SQL" MYFORM_overridden:TriggerText="handle_error;" />
  </FormModule>
</Module>`;

describe('parseFmbXml - real Oracle frmf2xml format', () => {
  it('should parse FormModule name and title from namespaced attributes', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    expect(result.name).toBe('MYFORM');
    expect(result.title).toBe('My Application');
  });

  it('should parse blocks inside FormModule', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].name).toBe('B1_HEADER');
    expect(result.blocks[1].name).toBe('B2_DETAIL');
  });

  it('should resolve namespaced QueryDataSourceName with priority', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    // B1_HEADER has _default: prefix
    expect(result.blocks[0].queryDataSource).toBe('HEADER_TABLE');
    // B2_DETAIL has _overridden: prefix (higher priority)
    expect(result.blocks[1].queryDataSource).toBe('DETAIL_VIEW');
  });

  it('should normalize human-readable item types', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    const items = result.blocks[0].items;
    expect(items[0].itemType).toBe('TEXT_ITEM');
    expect(items[1].itemType).toBe('CHECK_BOX');
    expect(items[2].itemType).toBe('PUSH_BUTTON');
    expect(items[3].itemType).toBe('DISPLAY_ITEM');
  });

  it('should read CanvasName (not Canvas) for real format', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    expect(result.blocks[0].items[0].canvas).toBe('CVS_MAIN');
  });

  it('should read TabPageName (not TabPage) for real format', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    const detailItems = result.blocks[1].items;
    expect(detailItems[0].tabPage).toBe('TAB_DET');
  });

  it('should parse canvases and tab pages from namespaced attributes', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    expect(result.canvases).toHaveLength(1);
    expect(result.canvases[0].name).toBe('CVS_MAIN');
    expect(result.canvases[0].tabPages).toHaveLength(2);
    expect(result.canvases[0].tabPages[1].label).toBe('Detail Tab');
  });

  it('should parse LOVs inside FormModule', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    expect(result.lovs).toHaveLength(1);
    expect(result.lovs[0].name).toBe('LOV_STATUS');
  });

  it('should parse module-level triggers inside FormModule', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    expect(result.triggers).toHaveLength(1);
    expect(result.triggers[0].name).toBe('ON-ERROR');
  });

  it('should parse block-level triggers with namespaced attributes', () => {
    const result = parseFmbXml(REAL_FMB_XML);
    expect(result.blocks[1].triggers).toHaveLength(1);
    expect(result.blocks[1].triggers[0].triggerText).toBe('null;');
  });
});
