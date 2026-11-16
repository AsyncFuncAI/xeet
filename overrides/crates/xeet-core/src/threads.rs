//! Threads post layout, using Xeet's shaping and raster pipeline.
//! Geometry is a Threads-style implementation, not a pixel-parity certification.
use crate::{display::{DisplayList,Item,ImageRef,Rect,Shape}, inline::{self,Span,BlockStyle,Wrap,Dir},model::{self,Post,RenderOptions,Theme,Verified},color::Rgba};
fn text(s:&str,w:f32,size:f32,weight:u16,c:Rgba)->inline::TextBlock {
 inline::layout(&[Span::new(s,c,weight)], &BlockStyle{size,line_height:size*1.4,weight,width:w.max(1.0),max_lines:None,wrap:Wrap::Anywhere,preserve:true,dir:Dir::Auto,tab_size:4.0})
}
fn icon(l:&mut DisplayList,name:&str,x:f32,y:f32,size:f32,c:Rgba){ l.items.push(Item::Icon{name:name.into(),rect:Rect::new(x,y,size,size),color:c}); }
pub fn layout(p:&Post,o:&RenderOptions)->(DisplayList,model::Report) {
 let dark=o.theme==Theme::Dark;
 let bg=if dark {Rgba::rgb(16,16,16)}else{Rgba::rgb(255,255,255)};
 let fg=if dark {Rgba::rgb(245,245,245)}else{Rgba::rgb(16,16,16)};
 let muted=if dark {Rgba::rgb(153,153,153)}else{Rgba::rgb(115,115,115)};
 let line=if dark {Rgba::rgb(48,48,48)}else{Rgba::rgb(229,229,229)};
 let width=o.width.clamp(200.0,1200.0);let mut l=DisplayList::new(width,0.0,Rgba::TRANSPARENT);
 let ax=24.0;let x=24.0;let w=width-48.0;let mut y=24.0;let header_x=72.0;
 let avatar=Shape::rounded(Rect::new(ax,y,36.0,36.0),18.0);
 if p.author.avatar.is_some(){l.items.push(Item::Image{shape:avatar,image:ImageRef::Avatar,focus:(0.5,0.5)});}else{
  l.items.push(Item::Fill{shape:avatar,color:line});let initial=p.author.handle.chars().next().unwrap_or('t').to_uppercase().to_string();l.push_text(&text(&initial,26.0,16.0,700,muted),ax+10.0,y+6.0);
 }
 let name=if p.author.handle.is_empty(){if p.author.name.is_empty(){"threads"}else{&p.author.name}}else{p.author.handle.trim_start_matches('@')};
 let h=crate::frame::header::one_line(name,fg,700,crate::tokens::TypeStyle{size:15.0,line_height:21.0},Wrap::Anywhere,false,(w-125.0).max(40.0));
 l.push_text(&h,header_x,y+8.0);let mut hx=header_x+h.width+8.0;
 if !matches!(p.author.verified,Verified::None){icon(&mut l,"teet-verified",hx,y+11.0,14.0,Rgba::rgb(0,149,246));hx+=20.0;}
 let stamp=if p.created_at.is_some(){crate::frame::time::label(p.created_at.as_deref(),p.now.as_deref(),false)}else{String::new()};
 if hx+28.0<width-38.0{l.push_text(&text(&stamp,width-38.0-hx,14.0,400,muted),hx,y+9.0);}
 icon(&mut l,"teet-more",width-44.0,y+8.0,20.0,muted);y+=52.0;
 let body=text(&p.text,w,15.0*o.font_scale,400,fg);
 for (i,paragraph) in p.text.split("\n\n").enumerate(){if i>0{y+=10.0;}let b=text(paragraph.trim_end(),w,15.0*o.font_scale,400,fg);l.push_text(&b,x,y);y+=b.height;}
 if !p.media.is_empty(){
  y+=8.0;let n=p.media.len().min(4);let gap=6.0;let mw=if n==1{w}else{(w-gap)/2.0};
  for (i,m) in p.media.iter().take(n).enumerate(){let col=if n==1{0}else{i%2};let row=if n==1{0}else{i/2};
   let mh=if n==1{(mw*m.height.max(1) as f32/m.width.max(1) as f32).clamp(90.0,420.0)}else{mw*1.1};
   let shape=Shape::rounded(Rect::new(x+col as f32*(mw+gap),y+row as f32*(mh+gap),mw,mh),12.0);
   if m.data.is_some(){l.items.push(Item::Image{shape,image:ImageRef::Media(i),focus:(0.5,0.5)});}else{l.items.push(Item::Placeholder{shape,label:if matches!(m.kind,model::MediaKind::Video){"Video".into()}else{"Image".into()}});}
   if matches!(m.kind,model::MediaKind::Video){icon(&mut l,"teet-play",shape.rect.x+mw/2.0-14.0,shape.rect.y+mh/2.0-14.0,28.0,Rgba::WHITE);}
  }
  let m=&p.media[0];y+=if n==1{(w*m.height.max(1) as f32/m.width.max(1) as f32).clamp(90.0,420.0)}else{(n.div_ceil(2)) as f32*(mw*1.1+gap)-gap};
 }
 if let Some(q)=p.quote.as_deref(){
  y+=12.0;let head=text(&format!("{}",q.author.handle.trim_start_matches('@')),w-24.0,14.0,700,fg);let qt=text(&q.text,w-24.0,14.0,400,fg);let hh=head.height+qt.height+28.0;
  l.items.push(Item::Stroke{shape:Shape::rounded(Rect::new(x,y,w,hh),12.0),color:line,width:1.0});l.push_text(&head,x+12.0,y+10.0);l.push_text(&qt,x+12.0,y+head.height+14.0);y+=hh;
 }
 if let Some(poll)=&p.poll {y+=12.0;for choice in &poll.choices {let t=text(choice,w-24.0,14.0,400,fg);l.items.push(Item::Stroke{shape:Shape::rounded(Rect::new(x,y,w,t.height+16.0),8.0),color:line,width:1.0});l.push_text(&t,x+12.0,y+8.0);y+=t.height+23.0;}}
 y+=14.0;let c=p.counts.clone().unwrap_or_default();let mut xx=x;
 for (name,num) in [("teet-like",c.likes),("teet-reply",c.replies),("teet-repost",c.reposts),("teet-share",0)] {icon(&mut l,name,xx,y,18.0,fg);let mut advance=44.0;if num>0 {let t=text(&crate::frame::numbers::compact(num),75.0,13.0,400,fg);l.push_text(&t,xx+23.0,y);advance+=t.width+4.0;}xx+=advance;}
 y+=42.0;l.height=y;
 let card=Shape::rounded(Rect::new(0.5,0.5,width-1.0,y-1.0),24.0);
 l.items.insert(0,Item::Fill{shape:card,color:bg});
 l.items.push(Item::Stroke{shape:card,color:line,width:1.0});
 let mut report=model::Report::default();report.ruleset="teet-threads-v2".into();report.size=model::Size{width,height:y};report.length=model::Length{weighted:p.text.chars().count() as u32,limit:500,valid:p.text.chars().count()<=500};report.text=model::TextReport{lines:body.lines.len(),visible:p.text.clone(),..Default::default()};
 report.warnings.push("Threads-style rendering with open Noto fonts; not certified pixel-identical to Meta’s apps.".into());
 if p.media.len()>4 {report.warnings.push("Preview shows the first four attachments.".into());}
 (l,report)
}
